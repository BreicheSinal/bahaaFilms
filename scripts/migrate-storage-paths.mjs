#!/usr/bin/env node
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

loadEnvFiles([
  ".env",
  ".env.local",
  "apps/admin/.env.local",
  "apps/web/.env.local",
]);

function readEnv(primary, fallback) {
  return process.env[primary] || (fallback ? process.env[fallback] : undefined);
}

const adminProjectId = readEnv("FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const adminClientEmail = readEnv("FIREBASE_CLIENT_EMAIL", "NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL");
const adminPrivateKey = normalizePrivateKey(
  readEnv("FIREBASE_PRIVATE_KEY", "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY")
);

const APPLY_FLAG = "--apply";
const REPORT_FLAG = "--report";
const BATCH_LIMIT = 400;

const isApply = process.argv.includes(APPLY_FLAG);
const isDryRun = !isApply;
const explicitReportPath = readFlagValue(REPORT_FLAG);

if (
  !adminProjectId ||
  !adminClientEmail ||
  !adminPrivateKey
) {
  console.error(
    "Missing admin credentials. Set FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID/NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL/NEXT_PUBLIC_FIREBASE_PRIVATE_KEY."
  );
  process.exit(1);
}

const bucketName = resolveStorageBucketName();
if (!bucketName) {
  console.error(
    "Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET (preferred) or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: adminProjectId,
      clientEmail: adminClientEmail,
      privateKey: adminPrivateKey.replace(/\\n/g, "\n"),
    }),
    storageBucket: bucketName,
  });
}

const db = getFirestore();
const bucket = getStorage().bucket(bucketName);

const runStartedAt = new Date().toISOString();
const reportPath = explicitReportPath || buildDefaultReportPath(runStartedAt);

const summary = {
  mode: isDryRun ? "dry-run" : "apply",
  startedAt: runStartedAt,
  bucketName,
  totalDocsScanned: 0,
  totalFieldsEligible: 0,
  skippedProjectsPrefix: 0,
  skippedLogoPrefix: 0,
  skippedEmptyOrInvalid: 0,
  missingSourceObjects: 0,
  plannedRewrites: 0,
  copiedObjects: 0,
  firestoreDocsUpdated: 0,
  verificationFailures: 0,
};

const perDocResults = [];
const pendingFirestoreUpdates = [];
const verificationQueue = [];

const snapshot = await db.collection("projects").get();
summary.totalDocsScanned = snapshot.size;

console.log(
  `[migrate-storage-paths] mode=${summary.mode}, docs=${summary.totalDocsScanned}, bucket=${bucketName}`
);

for (const docSnap of snapshot.docs) {
  const docId = docSnap.id;
  const row = docSnap.data() || {};
  const slug = slugify(row.slug || row.title || docId);
  const perDocPathCache = new Map();
  const usedDestinations = new Set();
  const docChanges = [];
  const docFailures = [];
  let updatePayload = {};
  let mediaChanged = false;

  const coverResult = await processPathField({
    rawValue: row.coverImagePath,
    slug,
    docId,
    fieldRef: "coverImagePath",
    perDocPathCache,
    usedDestinations,
  });
  if (coverResult.action === "rewrite") {
    updatePayload.coverImagePath = coverResult.newPath;
    docChanges.push({
      field: "coverImagePath",
      from: coverResult.oldPath,
      to: coverResult.newPath,
    });
  } else if (coverResult.action === "failed") {
    docFailures.push(`coverImagePath: ${coverResult.reason}`);
  }

  const logoResult = await processPathField({
    rawValue: row.logoPath,
    slug,
    docId,
    fieldRef: "logoPath",
    perDocPathCache,
    usedDestinations,
    keepLogoPrefix: true,
  });
  if (logoResult.action === "rewrite") {
    updatePayload.logoPath = logoResult.newPath;
    docChanges.push({
      field: "logoPath",
      from: logoResult.oldPath,
      to: logoResult.newPath,
    });
  } else if (logoResult.action === "failed") {
    docFailures.push(`logoPath: ${logoResult.reason}`);
  }

  const mediaArray = Array.isArray(row.media) ? row.media : row.media ? [row.media] : [];
  if (mediaArray.length > 0) {
    const nextMedia = mediaArray.map((item) => ({ ...(item || {}) }));

    for (let i = 0; i < nextMedia.length; i += 1) {
      const media = nextMedia[i];

      const storagePathResult = await processPathField({
        rawValue: media.storagePath,
        slug,
        docId,
        fieldRef: `media[${i}].storagePath`,
        perDocPathCache,
        usedDestinations,
      });
      if (storagePathResult.action === "rewrite") {
        media.storagePath = storagePathResult.newPath;
        mediaChanged = true;
        docChanges.push({
          field: `media[${i}].storagePath`,
          from: storagePathResult.oldPath,
          to: storagePathResult.newPath,
        });
      } else if (storagePathResult.action === "failed") {
        docFailures.push(`media[${i}].storagePath: ${storagePathResult.reason}`);
      }

      const thumbnailPathResult = await processPathField({
        rawValue: media.thumbnailPath,
        slug,
        docId,
        fieldRef: `media[${i}].thumbnailPath`,
        perDocPathCache,
        usedDestinations,
      });
      if (thumbnailPathResult.action === "rewrite") {
        media.thumbnailPath = thumbnailPathResult.newPath;
        mediaChanged = true;
        docChanges.push({
          field: `media[${i}].thumbnailPath`,
          from: thumbnailPathResult.oldPath,
          to: thumbnailPathResult.newPath,
        });
      } else if (thumbnailPathResult.action === "failed") {
        docFailures.push(`media[${i}].thumbnailPath: ${thumbnailPathResult.reason}`);
      }
    }

    if (mediaChanged) {
      updatePayload.media = nextMedia;
    }
  }

  const hasUpdates = Object.keys(updatePayload).length > 0;
  if (hasUpdates) {
    summary.plannedRewrites += docChanges.length;
    pendingFirestoreUpdates.push({ docId, updatePayload });
    for (const change of docChanges) {
      verificationQueue.push({ docId, path: change.to });
    }
  }

  if (docFailures.length > 0) {
    perDocResults.push({
      docId,
      slug,
      status: "failed",
      reason: docFailures.join("; "),
      changes: docChanges,
    });
  } else if (hasUpdates) {
    perDocResults.push({
      docId,
      slug,
      status: "updated",
      reason: isDryRun ? "planned rewrites" : "copied and ready for Firestore update",
      changes: docChanges,
    });
  } else {
    perDocResults.push({
      docId,
      slug,
      status: "skipped",
      reason: "no eligible legacy paths",
      changes: [],
    });
  }
}

if (isApply && pendingFirestoreUpdates.length > 0) {
  for (let i = 0; i < pendingFirestoreUpdates.length; i += BATCH_LIMIT) {
    const chunk = pendingFirestoreUpdates.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const item of chunk) {
      batch.set(db.collection("projects").doc(item.docId), item.updatePayload, {
        merge: true,
      });
    }
    await batch.commit();
    summary.firestoreDocsUpdated += chunk.length;
  }

  for (const item of verificationQueue) {
    const docSnap = await db.collection("projects").doc(item.docId).get();
    if (!docSnap.exists) {
      summary.verificationFailures += 1;
      appendFailure(item.docId, "Verification failed: project doc missing after update");
      continue;
    }

    const [exists] = await bucket.file(item.path).exists();
    if (!exists) {
      summary.verificationFailures += 1;
      appendFailure(item.docId, `Verification failed: destination missing (${item.path})`);
    }
  }
}

const runEndedAt = new Date().toISOString();
const report = {
  summary: {
    ...summary,
    endedAt: runEndedAt,
    totalDocResults: perDocResults.length,
  },
  results: perDocResults,
};

await writeReport(reportPath, report);

console.log(
  `[migrate-storage-paths] done mode=${summary.mode} docs=${summary.totalDocsScanned} plannedRewrites=${summary.plannedRewrites}`
);
console.log(
  `[migrate-storage-paths] skipped projects/=${summary.skippedProjectsPrefix}, Logo/=${summary.skippedLogoPrefix}, invalid=${summary.skippedEmptyOrInvalid}, missingSource=${summary.missingSourceObjects}`
);
if (isApply) {
  console.log(
    `[migrate-storage-paths] copiedObjects=${summary.copiedObjects}, firestoreDocsUpdated=${summary.firestoreDocsUpdated}, verificationFailures=${summary.verificationFailures}`
  );
}
console.log(`[migrate-storage-paths] report=${reportPath}`);

function appendFailure(docId, message) {
  const index = perDocResults.findIndex((item) => item.docId === docId);
  if (index < 0) return;
  const current = perDocResults[index];
  const reason = current.reason ? `${current.reason}; ${message}` : message;
  perDocResults[index] = {
    ...current,
    status: "failed",
    reason,
  };
}

async function processPathField({
  rawValue,
  slug,
  docId,
  fieldRef,
  perDocPathCache,
  usedDestinations,
  keepLogoPrefix = false,
}) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    summary.skippedEmptyOrInvalid += 1;
    return { action: "skip", reason: "empty or non-string path" };
  }

  const normalizedSourcePath = normalizeStorageObjectPath(rawValue);
  if (!normalizedSourcePath) {
    summary.skippedEmptyOrInvalid += 1;
    return { action: "skip", reason: "unsupported path format" };
  }

  if (isProjectsPath(normalizedSourcePath)) {
    summary.skippedProjectsPrefix += 1;
    return { action: "skip", reason: "already in projects/" };
  }

  if (fieldRef === "coverImagePath" && isCoverImagePath(normalizedSourcePath)) {
    return { action: "skip", reason: "already in CoverImage/" };
  }

  if (keepLogoPrefix && isLogoPath(normalizedSourcePath)) {
    summary.skippedLogoPrefix += 1;
    return { action: "skip", reason: "Logo/ path preserved" };
  }

  summary.totalFieldsEligible += 1;
  const destinationPath = assignDestinationPath({
    sourcePath: normalizedSourcePath,
    slug,
    docId,
    fieldRef,
    perDocPathCache,
    usedDestinations,
  });

  if (isDryRun) {
    return {
      action: "rewrite",
      oldPath: rawValue,
      newPath: destinationPath,
    };
  }

  const sourceFile = bucket.file(normalizedSourcePath);
  const [sourceExists] = await sourceFile.exists();
  if (!sourceExists) {
    summary.missingSourceObjects += 1;
    return {
      action: "failed",
      reason: `source object not found (${normalizedSourcePath})`,
    };
  }

  const destinationFile = bucket.file(destinationPath);
  const [destinationExistsBefore] = await destinationFile.exists();

  if (!destinationExistsBefore) {
    await sourceFile.copy(destinationFile);
    summary.copiedObjects += 1;
  }

  const [destinationExistsAfter] = await destinationFile.exists();
  if (!destinationExistsAfter) {
    return {
      action: "failed",
      reason: `destination verify failed (${destinationPath})`,
    };
  }

  return {
    action: "rewrite",
    oldPath: rawValue,
    newPath: destinationPath,
  };
}

function assignDestinationPath({
  sourcePath,
  slug,
  docId,
  fieldRef,
  perDocPathCache,
  usedDestinations,
}) {
  const cacheKey = `${fieldRef}::${sourcePath}`;
  if (perDocPathCache.has(cacheKey)) {
    return perDocPathCache.get(cacheKey);
  }

  const baseName = path.posix.basename(sourcePath) || "asset";
  const safeSlug = slugify(slug || docId || "project");
  let destinationBase = `projects/${safeSlug}/${baseName}`;
  if (fieldRef === "logoPath") {
    destinationBase = `Logo/${baseName}`;
  } else if (fieldRef === "coverImagePath") {
    destinationBase = `CoverImage/${safeSlug}/${baseName}`;
  }

  let candidate = destinationBase;
  let index = 2;
  while (usedDestinations.has(candidate)) {
    candidate = withFileSuffix(destinationBase, `-${index}`);
    index += 1;
  }

  usedDestinations.add(candidate);
  perDocPathCache.set(cacheKey, candidate);
  return candidate;
}

function withFileSuffix(fullPath, suffix) {
  const dirname = path.posix.dirname(fullPath);
  const ext = path.posix.extname(fullPath);
  const filename = path.posix.basename(fullPath, ext);
  return `${dirname}/${filename}${suffix}${ext}`;
}

function isProjectsPath(storagePath) {
  return storagePath.toLowerCase().startsWith("projects/");
}

function isLogoPath(storagePath) {
  return storagePath.startsWith("Logo/");
}

function isCoverImagePath(storagePath) {
  return storagePath.startsWith("CoverImage/");
}

function normalizeStorageObjectPath(input) {
  const value = String(input || "").trim();
  if (!value) return null;

  if (!/^https?:\/\//i.test(value) && !/^gs:\/\//i.test(value)) {
    return value.replace(/^\/+/, "");
  }

  if (/^gs:\/\//i.test(value)) {
    const withoutScheme = value.replace(/^gs:\/\//i, "");
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex < 0) return null;
    const objectPath = withoutScheme.slice(slashIndex + 1).trim();
    return objectPath || null;
  }

  try {
    const url = new URL(value);
    const firebaseMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
    if (firebaseMatch?.[1]) {
      const decoded = decodeURIComponent(firebaseMatch[1]).trim();
      return decoded || null;
    }

    const gcsMatch = url.pathname.match(/^\/[^/]+\/(.+)$/);
    if (gcsMatch?.[1]) {
      const decoded = decodeURIComponent(gcsMatch[1]).trim();
      return decoded || null;
    }
  } catch {
    return null;
  }

  return null;
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "project";
}

function normalizeBucketName(value) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed
    .replace(/^gs:\/\//i, "")
    .replace(/^https?:\/\/storage\.googleapis\.com\//i, "");
  const bucket = withoutProtocol.split("/")[0]?.trim() || "";

  if (!bucket) return null;
  if (!/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(bucket)) return null;
  return bucket;
}

function resolveStorageBucketName() {
  const envBucket =
    normalizeBucketName(process.env.FIREBASE_STORAGE_BUCKET) ||
    normalizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  if (envBucket) return envBucket;

  const projectId = adminProjectId?.trim();
  if (!projectId) return null;
  return `${projectId}.appspot.com`;
}

function buildDefaultReportPath(isoDateTime) {
  const stamp = isoDateTime.replace(/[:.]/g, "-");
  return path.join("scripts", "reports", `migrate-storage-paths-${stamp}.json`);
}

function readFlagValue(flagName) {
  const index = process.argv.findIndex((arg) => arg === flagName);
  if (index < 0) return null;
  return process.argv[index + 1] || null;
}

async function writeReport(filePath, data) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function loadEnvFiles(relPaths) {
  for (const rel of relPaths) {
    const absolute = path.resolve(rel);
    let content;
    try {
      content = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    applyEnvText(content);
  }
}

function applyEnvText(content) {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function normalizePrivateKey(value) {
  if (!value) return undefined;

  let key = String(value).trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  key = key
    .replace(/\\n/g, "\n")
    .replace(/`r`n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";
  const beginIndex = key.indexOf(beginMarker);
  const endIndex = key.indexOf(endMarker);

  if (beginIndex >= 0 && endIndex >= 0 && endIndex > beginIndex) {
    key = key.slice(beginIndex, endIndex + endMarker.length);
  }

  return key.endsWith("\n") ? key : `${key}\n`;
}
