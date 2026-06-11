# IOCAG Web Setup Guide

This guide provides step-by-step instructions for configuring the necessary third-party services for **IOCAG Web**: Firebase (Authentication & Firestore) and Gmail IMAP (for Phishing Email forwarding).

---

## 1. Firebase Setup (Client & Admin)

IOCAG Web requires a Firebase project to handle Authentication and store Threat Events (Firestore).

### Step 1.1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g., `iocag-web`).
3. Disable Google Analytics (optional but recommended for dev).
4. Wait for the project to provision and click **Continue**.

### Step 1.2: Enable Authentication
1. On the left sidebar, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable the following providers:
   - **Email/Password:** Click it, enable the toggle, and click **Save**.
   - **Google:** Click it, enable the toggle, provide a support email, and click **Save**.

### Step 1.3: Enable Firestore Database
1. On the left sidebar, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in test mode** (WARNING: Update security rules before production!).
4. Choose a location close to you and click **Enable**.

### Step 1.4: Get Client Credentials (for `.env`)
1. Click the **Gear Icon** next to "Project Overview" and select **Project settings**.
2. Scroll down to the **Your apps** section.
3. Click the **Web** icon (`</>`) to add a Firebase Web App.
4. Register the app (name it `iocag-client`).
5. Copy the configuration object provided.
6. Open your `iocag-web/.env` file and populate the `NEXT_PUBLIC_FIREBASE_*` variables with the values from the config object.

### Step 1.5: Set up Firebase Admin (Server-side)
Because we use Firebase Admin to verify requests securely on our API routes, you need to provide Admin credentials to your Node.js environment.

1. In your **Project settings**, go to the **Service accounts** tab.
2. Ensure **Node.js** is selected.
3. Click **Generate new private key**. This will download a JSON file.
4. Rename this file to `firebase-service-account.json` and place it somewhere secure on your computer.
5. In your local terminal where you run `npm run dev`, set the following environment variable to point to that JSON file:
   - **Windows (PowerShell):** `$env:GOOGLE_APPLICATION_CREDENTIALS="d:\VS Code\GPCSSI26\iocag-web\firebase-service-account.json"`
   - **Windows (CMD):** `set GOOGLE_APPLICATION_CREDENTIALS=d:\VS Code\GPCSSI26\iocag-web\firebase-service-account.json`
   - **Mac/Linux:** `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-service-account.json"`

*(Note: The application uses `applicationDefault()` to find this file, which keeps the private key out of your `.env` file for security).*

### Step 1.6: Deploy Firestore Security Rules
We have generated strict, production-ready security rules in the file `firestore.rules` that enforce organization boundaries and protect your data.

To apply them, you have two options:
**Option A: Through the Firebase Console (Easiest)**
1. Go to **Firestore Database** in the Firebase Console.
2. Click on the **Rules** tab at the top.
3. Open the `firestore.rules` file in VS Code, copy all of the text, and paste it into the Rules editor in the browser.
4. Click **Publish**.

**Option B: Using the Firebase CLI**
In your VS Code terminal, run:
```bash
npm i -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

---

## 2. Gmail IMAP Setup (Phishing Mail Sync)

To use the `/api/email-sync` endpoint, you need an email inbox that the application can log into via IMAP to read forwarded phishing reports.

### Step 2.1: Create a dedicated Gmail Account
1. Create a fresh Gmail account specifically for this app (e.g., `iocag.phishing@gmail.com`).
2. *Do not use your personal email account, as the app will mark emails as "read".*

### Step 2.2: Enable IMAP
1. Log into the dedicated Gmail account.
2. Click the **Gear icon** in the top right > **See all settings**.
3. Go to the **Forwarding and POP/IMAP** tab.
4. Under the **IMAP access** section, select **Enable IMAP**.
5. Scroll down and click **Save Changes**.

### Step 2.3: Generate an App Password
Google no longer allows basic username/password logins for IMAP without Two-Factor Authentication (2FA) and App Passwords.

1. Go to your [Google Account Manage page](https://myaccount.google.com/).
2. On the left sidebar, click **Security**.
3. Under the "How you sign in to Google" section, enable **2-Step Verification** if it isn't already enabled.
4. Once 2FA is active, search for **App passwords** in the top search bar (or look under the 2-Step Verification settings).
5. In the App Passwords screen, select **Other (Custom name)** from the dropdown.
6. Name it `IOCAG Sync` and click **Generate**.
7. Google will display a 16-character password in a yellow box. **Copy this.**

### Step 2.4: Update `.env`
Open your `iocag-web/.env` file and populate the IMAP variables:

```env
IMAP_USER="your-dedicated-email@gmail.com"
IMAP_PASSWORD="the-16-character-app-password"
IMAP_HOST="imap.gmail.com"
IMAP_PORT="993"
```

---

## 3. Run the App

Once both Firebase and your `.env` are configured:
```bash
npm install
npm run dev
```
