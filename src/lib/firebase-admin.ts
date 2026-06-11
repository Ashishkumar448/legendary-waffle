import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();

let credential;
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    // Only try applicationDefault if we aren't explicitly missing the Vercel keys.
    // If it fails, it will throw and be caught.
    credential = applicationDefault();
  }
} catch (error) {
  console.warn("Firebase Admin failed to load credentials. Make sure Vercel Env Vars are set!");
}

const app = apps.length === 0 && credential ? initializeApp({
  credential,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}) : apps[0];

export const adminDb = app ? getFirestore(app) : null as any;
export const adminAuth = app ? getAuth(app) : null as any;
