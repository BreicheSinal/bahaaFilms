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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
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
  if (!storage) return path;

  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.warn("Falling back to raw storage path", error);
    return path;
  }
}
