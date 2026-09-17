# Hello Bite - Production-Ready Food Delivery & Daily Tiffin Web Application

A full-stack, mobile-first food delivery web application with real-time Firebase / Firestore synchronization, dynamic menu management, live order tracking, location-based delivery charges, continuous loud chime audio alerts, WhatsApp / Telegram order dispatching, and bug-free Vercel SPA deployment.

---

## 🔑 Key Credentials & Contact Information

| Detail | Value |
|---|---|
| **Admin Portal Password** | `9771264784` |
| **Password Input Label** | `ENTER PASSWORD` |
| **Contact Person Name** | **SATYAM SINGH** |
| **Helpline Number** | **7091472879** |
| **WhatsApp Direct Link** | `https://wa.me/917091472879` |

---

## 🚀 1. Vercel Deployment Guide (Zero 404 Routing Errors)

Single Page Applications (SPAs) built with Vite can throw `404 Not Found` when a user refreshes an internal page unless all routes are rewritten to `index.html`.

The application includes `vercel.json` in the project root:

```json
{
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
}
```

### Steps to Deploy on Vercel:
1. Push this project to your GitHub account (`git push origin main`).
2. Log into [Vercel](https://vercel.com) and click **"Add New... > Project"**.
3. Select the repository. Vercel will automatically detect Vite.
4. Leave the Build Command as `npm run build` and Output Directory as `dist`.
5. Click **"Deploy"**.
6. Your app is live with zero 404 routing errors on page refresh!

---

## 🔥 2. Firebase Database Setup Guide

Hello Bite includes real-time Firestore synchronization and a local broadcast fallback so it functions seamlessly in preview and across browser tabs.

### Step-by-Step Firebase Integration:
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Click **"Add project"** and name it (e.g. `hello-bite-delivery`).
3. In the left navigation, click **Build > Firestore Database** (or Realtime Database).
4. Click **Create Database**. Select Start in **Test mode** (for development) or configure production security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /dishes/{dishId} {
         allow read: if true;
         allow write: if true; // Or authenticate admin
       }
       match /orders/{orderId} {
         allow read, write: if true;
       }
     }
   }
   ```
5. Click the **Project Settings (Gear icon)** > **General** > **Your apps**.
6. Click the Web icon (`</>`) to register a web app.
7. Copy your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef"
   };
   ```
8. In the **Admin Dashboard > Settings & Firebase**, paste these credentials and toggle **"Enable Cloud Firebase Sync"**.

---

## 🔔 3. Continuous Loud Audio Chime Warning Setup

### How It Works:
- When a customer places an order from any phone, computer, or browser window, the Admin Dashboard triggers a continuous high-visibility chime:
  1. A red flashing banner is displayed: **"⚠️ NEW ORDER RECEIVED!"**
  2. The Web Audio API synthesizer generates a repeating, high-pitch 3-tone harmonic chime (880Hz, 1175Hz, 1760Hz).
  3. The sound continues looping every 1.4 seconds until the admin clicks **"Acknowledge & Stop Alert"** or marks the order as **Accepted**.

### Browser Autoplay Policy Note:
Modern mobile and desktop browsers (Chrome, Safari, iOS, Android) require one user interaction before unmuting audio. At the start of an operating shift, the admin should click **"Test Loud Chime"** on the top bar or inside Settings to prime the Web Audio context and adjust speaker volume.

---

## 🛵 4. Dynamic Location-Based Delivery Charges

Delivery charges automatically adjust based on the customer's selected zone:
- **Local Area (0-3 km):** ₹20 (ETA: 20-25 mins)
- **Near Suburbs (3-7 km):** ₹40 (ETA: 30-40 mins)
- **City Outskirts (7-12 km):** ₹60 (ETA: 45-55 mins)
- **Highway Hub / Extended (12+ km):** ₹80 (ETA: 55-65 mins)

*Admins can edit charges, add new areas, or change ETAs in real-time under Admin Dashboard > Settings.*

---

## 📱 5. Direct Admin WhatsApp & Telegram Group Notification

When a customer clicks **"Place Order"**:
1. The order is committed to the database.
2. A direct formatted invoice message is compiled and pre-filled for WhatsApp Helpline: `7091472879` (**SATYAM SINGH**).
3. If configured with a Telegram Bot Token and Chat ID in Admin Settings, a webhook automatically broadcasts the order to the kitchen Telegram group.
4. The customer is transitioned to the **Live Order Tracker** modal with active step indicators (`Pending` → `Accepted` → `Out for Delivery` → `Delivered`).
