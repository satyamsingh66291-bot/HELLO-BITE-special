import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const HMAC_SECRET =
  process.env.OTP_HMAC_SECRET || 'hello-bite-superapp-dev-hmac-secret-2026';

type OtpRecord = {
  hash: string;
  expiresAt: number;
  attemptsLeft: number;
  sentAt: number;
};

type RateRecord = {
  timestamps: number[];
};

const otpStore = new Map<string, OtpRecord>();
const rateLimitStore = new Map<string, RateRecord>();

function normalizePhone(countryCode: string, phoneNumber: string) {
  const cleanCode = String(countryCode || '91').replace(/\D/g, '') || '91';
  const cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
  const e164 = `+${cleanCode}${cleanPhone}`;
  const masked =
    cleanPhone.length >= 4
      ? `+${cleanCode} ••••••${cleanPhone.slice(-4)}`
      : e164;
  const uidPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  return {
    cleanCode,
    cleanPhone,
    e164,
    masked,
    uid: `user_${uidPhone}`,
  };
}

function hashOtp(e164: string, otp: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${e164}:${otp}`)
    .digest('hex');
}

function signSessionToken(uid: string, phoneE164: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url'
  );
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: uid,
      phone: phoneE164,
      iss: 'hello-bite-auth',
      iat: nowSec,
      exp: nowSec + 30 * 24 * 3600,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function mintFirebaseCustomTokenIfConfigured(
  uid: string,
  claims: Record<string, unknown>
): string | null {
  const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawSa || !rawSa.trim()) return null;

  try {
    const sa = JSON.parse(rawSa) as {
      client_email?: string;
      private_key?: string;
    };
    if (!sa.client_email || !sa.private_key) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' })
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        sub: sa.client_email,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iat: nowSec,
        exp: nowSec + 3600,
        uid,
        claims,
      })
    ).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    signer.end();
    const signature = signer.sign(sa.private_key).toString('base64url');
    return `${header}.${payload}.${signature}`;
  } catch (err) {
    console.warn('Could not mint Firebase custom token:', err);
    return null;
  }
}

async function sendViaWhatsAppCloudApi(
  recipientDigits: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { ok: false, error: 'NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientDigits,
          type: 'text',
          text: {
            preview_url: false,
            body: `Your HELLO BITE verification code is *${otp}*. Valid for 5 minutes. Do not share this code with anyone.`,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `WhatsApp API error ${response.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'WhatsApp network failure',
    };
  }
}

async function sendViaTwilioWhatsApp(
  e164: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !authToken || !fromNumber) {
    return { ok: false, error: 'NOT_CONFIGURED' };
  }

  try {
    const params = new URLSearchParams();
    params.set(
      'From',
      fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`
    );
    params.set('To', `whatsapp:${e164}`);
    params.set(
      'Body',
      `HELLO BITE OTP: ${otp}. Valid for 5 minutes. Welcome to Food Delivery & Rides.`
    );

    const basicAuth = Buffer.from(`${sid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Twilio error ${response.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Twilio network failure',
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'hello-bite-server', timestamp: Date.now() });
  });

  app.get('/api/maps/config', (_req: Request, res: Response) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      '';
    res.json({
      apiKey,
      configured: Boolean(apiKey),
    });
  });

  app.get('/api/maps/reverse-geocode', async (req: Request, res: Response) => {
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ ok: false, error: 'Valid lat and lng are required.' });
      return;
    }

    if (!apiKey) {
      res.status(503).json({ ok: false, error: 'Maps API key not configured.' });
      return;
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('language', 'en');
      url.searchParams.set('key', apiKey);

      const upstream = await fetch(url.toString());
      const data = (await upstream.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{ formatted_address?: string; place_id?: string }>;
      };

      if (
        upstream.status === 429 ||
        data.status === 'OVER_QUERY_LIMIT' ||
        data.error_message?.includes('RESOURCE_EXHAUSTED')
      ) {
        res.status(429).json({
          ok: false,
          quotaExceeded: true,
          error: data.error_message || 'Google Maps Geocoding quota exceeded.',
        });
        return;
      }

      if (!upstream.ok || (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
        res.status(502).json({
          ok: false,
          error: data.error_message || `Geocoding failed: ${data.status || upstream.status}`,
        });
        return;
      }

      const first = data.results?.[0];
      res.json({
        ok: true,
        formattedAddress: first?.formatted_address || '',
        placeId: first?.place_id || '',
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Reverse geocode failed.',
      });
    }
  });

  app.post('/api/maps/route-distance', async (req: Request, res: Response) => {
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';
    const { originLat, originLng, destLat, destLng } = req.body || {};

    if (
      !Number.isFinite(Number(originLat)) ||
      !Number.isFinite(Number(originLng)) ||
      !Number.isFinite(Number(destLat)) ||
      !Number.isFinite(Number(destLng))
    ) {
      res.status(400).json({ ok: false, error: 'Valid origin and destination coordinates are required.' });
      return;
    }

    if (!apiKey) {
      res.status(503).json({ ok: false, error: 'Maps API key not configured.' });
      return;
    }

    try {
      const upstream = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: { latitude: Number(originLat), longitude: Number(originLng) },
              },
            },
            destination: {
              location: {
                latLng: { latitude: Number(destLat), longitude: Number(destLng) },
              },
            },
            travelMode: 'TWO_WHEELER',
            routingPreference: 'TRAFFIC_AWARE',
            languageCode: 'en-US',
            units: 'METRIC',
          }),
        }
      );

      const text = await upstream.text();
      let payload: {
        error?: { code?: number; status?: string; message?: string };
        routes?: Array<{
          distanceMeters?: number;
          duration?: string;
          polyline?: { encodedPolyline?: string };
        }>;
      } = {};
      try {
        payload = JSON.parse(text);
      } catch {
        payload = {};
      }

      if (
        upstream.status === 429 ||
        payload.error?.status === 'RESOURCE_EXHAUSTED' ||
        text.includes('RESOURCE_EXHAUSTED')
      ) {
        res.status(429).json({
          ok: false,
          quotaExceeded: true,
          error: payload.error?.message || 'Google Routes API quota exceeded.',
        });
        return;
      }

      if (!upstream.ok) {
        res.status(upstream.status).json({
          ok: false,
          error: payload.error?.message || `Routes API error ${upstream.status}`,
        });
        return;
      }

      const route = payload.routes?.[0];
      const distanceMeters = route?.distanceMeters ?? 0;
      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const durationSeconds = route?.duration
        ? parseInt(route.duration.replace('s', ''), 10)
        : 0;
      const durationMinutes = Math.max(10, Math.round(durationSeconds / 60) + 12);

      res.json({
        ok: true,
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        encodedPolyline: route?.polyline?.encodedPolyline || '',
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Route distance lookup failed.',
      });
    }
  });

  app.get('/api/auth/config-status', (_req: Request, res: Response) => {
    res.json({
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_CLOUD_API_TOKEN &&
          process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
      twilioConfigured: Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_WHATSAPP_FROM
      ),
      firebaseCustomAuthConfigured: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ),
    });
  });

  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const { countryCode = '91', phoneNumber = '' } = req.body || {};
      const { cleanCode, cleanPhone, e164, masked } = normalizePhone(
        countryCode,
        phoneNumber
      );

      if (
        (cleanCode === '91' && cleanPhone.length !== 10) ||
        cleanPhone.length < 7 ||
        cleanPhone.length > 15
      ) {
        res.status(400).json({
          success: false,
          code: 'INVALID_PHONE',
          error:
            cleanCode === '91'
              ? 'Please enter a valid 10-digit Indian mobile number.'
              : 'Please enter a valid mobile number (7-15 digits).',
        });
        return;
      }

      const now = Date.now();
      const existingOtp = otpStore.get(e164);
      if (existingOtp && now - existingOtp.sentAt < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil(
          (RESEND_COOLDOWN_MS - (now - existingOtp.sentAt)) / 1000
        );
        res.status(429).json({
          success: false,
          code: 'COOLDOWN_ACTIVE',
          retryAfterSeconds,
          error: `Please wait ${retryAfterSeconds}s before requesting another OTP.`,
        });
        return;
      }

      const rate = rateLimitStore.get(e164) || { timestamps: [] };
      rate.timestamps = rate.timestamps.filter(
        (ts) => now - ts < RATE_LIMIT_WINDOW_MS
      );
      if (rate.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: 60,
          error:
            'Too many OTP requests for this number. Please try again in a few minutes.',
        });
        return;
      }
      rate.timestamps.push(now);
      rateLimitStore.set(e164, rate);

      const otp = crypto.randomInt(100000, 1000000).toString();
      otpStore.set(e164, {
        hash: hashOtp(e164, otp),
        expiresAt: now + OTP_TTL_MS,
        attemptsLeft: MAX_VERIFY_ATTEMPTS,
        sentAt: now,
      });

      const recipientDigits = `${cleanCode}${cleanPhone}`;
      const waResult = await sendViaWhatsAppCloudApi(recipientDigits, otp);
      if (waResult.ok) {
        res.json({
          success: true,
          deliveryMode: 'whatsapp_cloud',
          maskedPhone: masked,
          expiresInSeconds: OTP_TTL_MS / 1000,
          resendCooldownSeconds: RESEND_COOLDOWN_MS / 1000,
        });
        return;
      }

      const twilioResult = await sendViaTwilioWhatsApp(e164, otp);
      if (twilioResult.ok) {
        res.json({
          success: true,
          deliveryMode: 'twilio_whatsapp',
          maskedPhone: masked,
          expiresInSeconds: OTP_TTL_MS / 1000,
          resendCooldownSeconds: RESEND_COOLDOWN_MS / 1000,
        });
        return;
      }

      // Built-in in-app WhatsApp sandbox simulation when third-party provider secrets are not attached
      res.json({
        success: true,
        deliveryMode: 'in_app_sandbox',
        sandboxOtpPreview: otp,
        maskedPhone: masked,
        expiresInSeconds: OTP_TTL_MS / 1000,
        resendCooldownSeconds: RESEND_COOLDOWN_MS / 1000,
      });
    } catch (err) {
      console.error('send-otp error:', err);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to dispatch verification code. Please try again.',
      });
    }
  });

  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    try {
      const { countryCode = '91', phoneNumber = '', otp = '' } = req.body || {};
      const { e164, uid } = normalizePhone(countryCode, phoneNumber);
      const cleanOtp = String(otp || '').replace(/\D/g, '');

      if (cleanOtp.length !== 6) {
        res.status(400).json({
          success: false,
          code: 'INVALID_OTP_FORMAT',
          error: 'Please enter the complete 6-digit OTP code.',
        });
        return;
      }

      const record = otpStore.get(e164);
      if (!record) {
        res.status(400).json({
          success: false,
          code: 'OTP_NOT_FOUND',
          error: 'No active OTP found. Please tap Resend OTP.',
        });
        return;
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(e164);
        res.status(400).json({
          success: false,
          code: 'EXPIRED_OTP',
          error: 'Your OTP has expired. Please request a fresh code.',
        });
        return;
      }

      if (record.attemptsLeft <= 0) {
        otpStore.delete(e164);
        res.status(429).json({
          success: false,
          code: 'MAX_ATTEMPTS_EXCEEDED',
          error:
            'Maximum verification attempts reached. Please request a new OTP.',
        });
        return;
      }

      const candidateHash = hashOtp(e164, cleanOtp);
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(candidateHash, 'hex'),
        Buffer.from(record.hash, 'hex')
      );

      if (!isMatch) {
        record.attemptsLeft -= 1;
        if (record.attemptsLeft <= 0) {
          otpStore.delete(e164);
          res.status(429).json({
            success: false,
            code: 'MAX_ATTEMPTS_EXCEEDED',
            attemptsRemaining: 0,
            error:
              'Too many incorrect attempts. Please request a new WhatsApp OTP.',
          });
          return;
        }
        otpStore.set(e164, record);
        res.status(400).json({
          success: false,
          code: 'INVALID_OTP',
          attemptsRemaining: record.attemptsLeft,
          error: `Invalid OTP. ${record.attemptsLeft} attempt${
            record.attemptsLeft === 1 ? '' : 's'
          } remaining.`,
        });
        return;
      }

      otpStore.delete(e164);
      const token = signSessionToken(uid, e164);
      const customToken = mintFirebaseCustomTokenIfConfigured(uid, {
        phoneNumber: e164,
        provider: 'whatsapp_otp',
      });

      res.json({
        success: true,
        verified: true,
        uid,
        phoneE164: e164,
        token,
        customToken,
      });
    } catch (err) {
      console.error('verify-otp error:', err);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'OTP verification failed due to a server error.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HELLO BITE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
