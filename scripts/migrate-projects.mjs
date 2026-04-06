#!/usr/bin/env node
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readEnv(primary, fallback) {
  return process.env[primary] || (fallback ? process.env[fallback] : undefined);
}

const adminProjectId = readEnv("FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const adminClientEmail = readEnv("FIREBASE_CLIENT_EMAIL", "NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL");
const adminPrivateKey = readEnv("FIREBASE_PRIVATE_KEY", "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY");

const isApply = process.argv.includes("--apply");
const isDryRun = !isApply;

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

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: adminProjectId,
      clientEmail: adminClientEmail,
      privateKey: adminPrivateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "project";
}

function normalizeDateTime(value) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return new Date(value).toISOString();
  }
  if (value?.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function deepRemoveUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => deepRemoveUndefined(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, val]) => [key, deepRemoveUndefined(val)])
      .filter(([, val]) => val !== undefined);
    return Object.fromEntries(entries);
  }

  return value === undefined ? undefined : value;
}

const snapshot = await db.collection("projects").get();
const existingSlugSnapshot = await db.collection("projectSlugs").get();
const usedSlugs = new Set(existingSlugSnapshot.docs.map((doc) => doc.id));

console.log(
  `[migrate-projects] mode=${isDryRun ? "dry-run" : "apply"}, docs=${snapshot.size}`
);

const operations = [];
for (const doc of snapshot.docs) {
  const row = doc.data();
  let slug = slugify(row.slug || row.title || doc.id);
  if (usedSlugs.has(slug)) {
    let i = 2;
    while (usedSlugs.has(`${slug}-${i}`)) i += 1;
    slug = `${slug}-${i}`;
  }
  usedSlugs.add(slug);

  const media = (Array.isArray(row.media) ? row.media : row.media ? [row.media] : []).map(
    (item) => ({
      type: item?.type === "video/mp4" ? "video" : item?.type || "image",
      storagePath: item?.storagePath || item?.url || "",
      thumbnailPath: item?.thumbnailPath || item?.thumbnail || undefined,
      sources: Array.isArray(item?.sources)
        ? item.sources
            .filter((source) => source?.url)
            .map((source) => ({ url: source.url, type: source.type }))
        : undefined,
    })
  );

  const normalized = deepRemoveUndefined({
    slug,
    title: row.title || "",
    shortDescription: row.shortDescription || "",
    fullDescription: row.fullDescription || "",
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
    logoPath: row.logoPath || row.logo || undefined,
    coverImagePath: row.coverImagePath || row.coverImage || "",
    media,
    status: row.status || "published",
    featured: Boolean(row.featured),
    hidden: Boolean(row.hidden ?? row.hide),
    sortOrder: Number.isFinite(row.sortOrder) ? row.sortOrder : 0,
    publishedAt:
      row.status === "published" || !row.status
        ? normalizeDateTime(row.publishedAt || row.date)
        : null,
    createdAt: normalizeDateTime(row.createdAt || row.date),
    updatedAt: normalizeDateTime(row.updatedAt || row.date),
    links: row.links || undefined,
  });

  operations.push({ id: doc.id, slug, normalized });
}

for (const op of operations) {
  if (isDryRun) {
    console.log(`[dry-run] ${op.id} -> slug=${op.slug}`);
    continue;
  }

  await db.runTransaction(async (tx) => {
    const projectRef = db.collection("projects").doc(op.id);
    const slugRef = db.collection("projectSlugs").doc(op.slug);
    tx.set(projectRef, deepRemoveUndefined(op.normalized), { merge: true });
    tx.set(
      slugRef,
      deepRemoveUndefined({ projectId: op.id, createdAt: op.normalized.createdAt }),
      { merge: true }
    );
  });

  console.log(`[apply] migrated ${op.id}`);
}

console.log("[migrate-projects] done");
