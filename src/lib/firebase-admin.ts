import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();

let credential;
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  credential = cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  credential = applicationDefault();
}

const app = apps.length === 0 ? initializeApp({
  credential,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}) : apps[0];

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
