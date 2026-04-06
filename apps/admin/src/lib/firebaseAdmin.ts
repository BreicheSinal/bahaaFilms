import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function readEnv(primary: string, fallback?: string): string | undefined {
  return process.env[primary] || (fallback ? process.env[fallback] : undefined);
}

function getAdminProjectId(): string | undefined {
  return readEnv("FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
}

function getAdminClientEmail(): string | undefined {
  return readEnv("FIREBASE_CLIENT_EMAIL", "NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL");
}

function getAdminPrivateKey(): string | undefined {
  return readEnv("FIREBASE_PRIVATE_KEY", "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY");
}

function normalizeBucketName(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed
    .replace(/^gs:\/\//i, "")
    .replace(/^https?:\/\/storage\.googleapis\.com\//i, "");
  const bucketName = withoutProtocol.split("/")[0]?.trim() || "";

  if (!bucketName) return null;
  if (!/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(bucketName)) return null;

  return bucketName;
}

function resolveStorageBucketName() {
  const envBucket =
    normalizeBucketName(process.env.FIREBASE_STORAGE_BUCKET) ||
    normalizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  if (envBucket) return envBucket;

  const projectId = getAdminProjectId()?.trim();
  if (!projectId) return null;

  // Firebase projects may use either legacy or newer default bucket hostnames.
  return `${projectId}.appspot.com`;
}

function adminConfigPresent() {
  return Boolean(
    getAdminProjectId() &&
      getAdminClientEmail() &&
      getAdminPrivateKey()
  );
}

function ensureAdminApp() {
  if (getApps().length) return getApps()[0]!;
  if (!adminConfigPresent()) {
    return null;
  }
  const storageBucket = resolveStorageBucketName() || undefined;

  return initializeApp({
    credential: cert({
      projectId: getAdminProjectId(),
      clientEmail: getAdminClientEmail(),
      privateKey: getAdminPrivateKey()?.replace(/\\n/g, "\n"),
    }),
    storageBucket,
  });
}

export function getAdminAuth() {
  const app = ensureAdminApp();
  if (!app) throw new Error("Missing Firebase Admin credentials");
  return getAuth(app);
}

export function getAdminDb() {
  const app = ensureAdminApp();
  if (!app) throw new Error("Missing Firebase Admin credentials");
  return getFirestore(app);
}

export function getAdminStorageBucket() {
  const app = ensureAdminApp();
  if (!app) throw new Error("Missing Firebase Admin credentials");

  const bucketName =
    resolveStorageBucketName() || normalizeBucketName(app.options.storageBucket);
  if (!bucketName) {
    throw new Error(
      "Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET (preferred) or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
    );
  }

  return getStorage(app).bucket(bucketName);
}
