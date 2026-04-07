import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getStorage,
  ref,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";

type FirebaseServices = {
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

function buildFirebaseMediaUrl(path: string): string | undefined {
  const bucket = firebaseConfig.storageBucket;
  if (!bucket) return undefined;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

export function getFirebaseServices(): FirebaseServices | null {
  if (!hasFirebaseConfig()) return null;

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);

  return { app, db, storage };
}

export async function buildStorageUrl(
  storage: FirebaseStorage | null,
  path?: string | null
): Promise<string | undefined> {
  if (!path) return undefined;
  if (isAbsoluteUrl(path) || path.startsWith("/")) return path;

  if (!storage) return path;

  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.warn("Falling back to Firebase media URL", error);
    return buildFirebaseMediaUrl(path) || path;
  }
}
