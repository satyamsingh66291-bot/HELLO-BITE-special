import React from 'react';
import { X, Flame, CheckCircle, Copy, ExternalLink, Shield, Bell, Globe } from 'lucide-react';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleFirebaseConfig = `// In Firebase Console > Project Settings > General > Your Apps (Web App)
{
  apiKey: "AIzaSy...",
  authDomain: "hellobite-production.firebaseapp.com",
  projectId: "hellobite-production",
  storageBucket: "hellobite-production.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef"
}`;

  const vercelJsonContent = `{
  "version": 2,
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-600 to-orange-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                Firebase &amp; Vercel Deployment Master Guide
              </h2>
              <p className="text-xs text-amber-100">
                Step-by-step setup for Live Database, Audio Alerts &amp; 404-Free Vercel Hosting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1: Firebase Setup */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Step 1: Firebase Realtime Database / Firestore Setup</span>
            </h3>

            <ol className="list-decimal pl-5 space-y-2 text-xs text-stone-600">
              <li>
                Visit the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and click <strong>&quot;Add Project&quot;</strong> (name it e.g. <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">hello-bite-app</code>).
              </li>
              <li>
                Under <strong>Build</strong> in the left sidebar, click <strong>Firestore Database</strong> (or Realtime Database) and click <strong>Create Database</strong> in Test Mode (or Production Mode with authenticated rules).
              </li>
              <li>
                Click the <strong>Project Settings (Gear icon) &gt; General</strong>, scroll down to <em>&quot;Your apps&quot;</em>, and click the Web icon (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">&lt;/&gt;</code>) to register a web app.
              </li>
              <li>
                Copy the generated <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">firebaseConfig</code> credentials and paste them directly into the <strong>Admin Dashboard &gt; Settings &gt; Firebase Configuration</strong> tab.
              </li>
              <li>
                Toggle <strong>&quot;Enable Cloud Firebase Sync&quot;</strong> to True. All customer orders and menu modifications will now synchronize to your cloud database in real-time!
              </li>
            </ol>

            <div className="bg-stone-900 text-stone-200 p-3 rounded-2xl relative font-mono text-[11px] overflow-x-auto">
              <button
                onClick={() => handleCopy(sampleFirebaseConfig, 'firebase')}
                className="absolute top-2.5 right-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"
              >
                {copiedSection === 'firebase' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'firebase' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre>{sampleFirebaseConfig}</pre>
            </div>
          </div>

          {/* Section 2: Loud Audio Alerts */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <span>Step 2: Real-time Loud Audio Chime Warning</span>
            </h3>

            <p className="text-xs text-stone-600">
              Modern mobile and desktop browsers (Chrome, Safari, Firefox) restrict automatic sound playback until a user interacts with the page (clicks or touches anywhere). Hello Bite includes:
            </p>

            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600">
              <li>
                <strong>Web Audio API Synthesizer:</strong> Zero-latency, crystal-clear 3-tone harmonic repeating chime (880Hz, 1175Hz, 1760Hz) that requires no external audio mp3 download.
              </li>
              <li>
                <strong>Volume &amp; Test Control:</strong> Click <strong>&quot;Test Loud Chime&quot;</strong> in the Admin Dashboard at the beginning of the shift. This unlocks browser audio and lets you adjust volume up to 100%.
              </li>
              <li>
                <strong>Automatic Multi-Device Sync:</strong> When an order is placed from any phone or browser window, the Admin Dashboard immediately sounds the alarm and flashes the red warning banner: <strong>&quot;⚠️ NEW ORDER RECEIVED!&quot;</strong>.
              </li>
            </ul>
          </div>

          {/* Section 3: Vercel Deployment & 404 Prevention */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
              <Globe className="w-4 h-4 text-orange-600" />
              <span>Step 3: Vercel 1-Click Deployment (Zero 404 Errors)</span>
            </h3>

            <p className="text-xs text-stone-600">
              Single-Page Applications (SPAs) often encounter 404 errors upon hard refresh if the server does not route all requests to <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">index.html</code>. We have included a pre-configured <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">vercel.json</code> in the root directory:
            </p>

            <div className="bg-stone-900 text-stone-200 p-3 rounded-2xl relative font-mono text-[11px] overflow-x-auto">
              <button
                onClick={() => handleCopy(vercelJsonContent, 'vercel')}
                className="absolute top-2.5 right-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"
              >
                {copiedSection === 'vercel' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'vercel' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre>{vercelJsonContent}</pre>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-stone-600">
              <li>Push this repository to GitHub.</li>
              <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline">Vercel.com</a> and click <strong>&quot;Add New... &gt; Project&quot;</strong>.</li>
              <li>Select your repository. Vercel will automatically detect <strong>Vite</strong> framework.</li>
              <li>Click <strong>&quot;Deploy&quot;</strong>. It will build in seconds and provide a production <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">.vercel.app</code> URL with 100% bug-free routing!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-2 rounded-xl text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
