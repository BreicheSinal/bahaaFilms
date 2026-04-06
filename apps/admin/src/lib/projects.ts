import { randomUUID } from "crypto";
import type { ProjectDoc } from "@portfolio/shared/types";
import { buildUniqueSlug, slugify } from "@portfolio/shared/utils/slug";
import { nowIsoString } from "@portfolio/shared/utils/date";
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebaseAdmin";

const PROJECTS_COLLECTION = "projects";
const SLUGS_COLLECTION = "projectSlugs";
const MAX_FEATURED_PROJECTS = 3;
const FILE_NOT_FOUND_ERROR_CODE = 404;

function toBucketObjectPath(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Raw storage object path (what we expect from uploads).
  if (!/^https?:\/\//i.test(value) && !/^gs:\/\//i.test(value)) {
    return value.replace(/^\/+/, "");
  }

  // gs://bucket/path/to/object
  if (/^gs:\/\//i.test(value)) {
    const withoutScheme = value.replace(/^gs:\/\//i, "");
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex < 0) return null;
    const objectPath = withoutScheme.slice(slashIndex + 1).trim();
    return objectPath ? objectPath : null;
  }

  // Firebase/GCS download URL:
  // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedObjectPath>?...
  // or https://storage.googleapis.com/<bucket>/<objectPath>
  try {
    const url = new URL(value);

    const firebaseMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
    if (firebaseMatch?.[1]) {
      const decoded = decodeURIComponent(firebaseMatch[1]).trim();
      return decoded ? decoded : null;
    }

    const gcsMatch = url.pathname.match(/^\/[^/]+\/(.+)$/);
    if (gcsMatch?.[1]) {
      const decoded = decodeURIComponent(gcsMatch[1]).trim();
      return decoded ? decoded : null;
    }
  } catch {
    return null;
  }

  return null;
}

async function isStoragePathUsedByOtherProjects(
  projectId: string,
  field: "coverImagePath" | "logoPath",
  storagePath: string
) {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection(PROJECTS_COLLECTION)
    .where(field, "==", storagePath)
    .limit(5)
    .get();

  return snapshot.docs.some((doc) => doc.id !== projectId);
}

async function deleteStoragePaths(paths: Iterable<string>) {
  const bucket = getAdminStorageBucket();
  const uniquePaths = Array.from(
    new Set(
      Array.from(paths)
        .map(toBucketObjectPath)
        .filter((path): path is string => Boolean(path))
    )
  );

  for (const path of uniquePaths) {
    try {
      await bucket.file(path).delete();
    } catch (error) {
      const isNotFound =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        Number((error as { code?: number }).code) === FILE_NOT_FOUND_ERROR_CODE;
      if (!isNotFound) {
        console.error(`Failed to delete storage file '${path}'`, error);
      }
    }
  }
}

function sanitizeLinks(links?: ProjectDoc["links"]): ProjectDoc["links"] | undefined {
  if (!links) return undefined;

  const next: NonNullable<ProjectDoc["links"]> = {};
  if (links.facebook?.trim()) next.facebook = links.facebook.trim();
  if (links.instagram?.trim()) next.instagram = links.instagram.trim();
  if (links.behance?.trim()) next.behance = links.behance.trim();

  return Object.keys(next).length ? next : undefined;
}

export async function getTakenSlugs(): Promise<Set<string>> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection(SLUGS_COLLECTION).get();
  return new Set(snapshot.docs.map((doc) => doc.id));
}

export async function listProjectsAdmin(): Promise<Array<ProjectDoc & { id: string }>> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection(PROJECTS_COLLECTION)
    .orderBy("sortOrder", "desc")
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ProjectDoc),
  }));
}

export async function getProjectById(
  id: string
): Promise<(ProjectDoc & { id: string }) | null> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection(PROJECTS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as ProjectDoc) };
}

export async function saveProject(input: {
  id?: string;
  slug?: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  logoPath?: string;
  coverImagePath: string;
  media: ProjectDoc["media"];
  featured: boolean;
  hidden: boolean;
  sortOrder?: number;
  links?: ProjectDoc["links"];
}) {
  const adminDb = getAdminDb();
  const projectId = input.id || randomUUID();
  const now = nowIsoString();

  const existing = input.id
    ? await adminDb.collection(PROJECTS_COLLECTION).doc(input.id).get()
    : null;
  const existingData = existing?.exists ? (existing.data() as ProjectDoc) : null;

  const desiredSlug = slugify(input.slug || input.title);
  const taken = await getTakenSlugs();
  if (existingData?.slug) taken.delete(existingData.slug);
  const slug = buildUniqueSlug(desiredSlug, taken);

  const status = existingData?.status || "draft";
  const publishedAt =
    status === "published"
      ? existingData?.publishedAt || now
      : existingData?.publishedAt || null;

  const payloadBase: Omit<ProjectDoc, "logoPath" | "links"> = {
    slug,
    title: input.title,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    tags: input.tags,
    coverImagePath: input.coverImagePath,
    media: input.media,
    status,
    featured: input.featured,
    hidden: input.hidden,
    sortOrder:
      typeof input.sortOrder === "number"
        ? input.sortOrder
        : typeof existingData?.sortOrder === "number"
        ? existingData.sortOrder
        : 0,
    publishedAt,
    createdAt: existingData?.createdAt || now,
    updatedAt: now,
  };
  const normalizedLogoPath = input.logoPath?.trim();
  const normalizedLinks = sanitizeLinks(input.links);
  const payload: ProjectDoc = {
    ...payloadBase,
    ...(normalizedLogoPath ? { logoPath: normalizedLogoPath } : {}),
    ...(normalizedLinks ? { links: normalizedLinks } : {}),
  };

  await adminDb.runTransaction(async (tx) => {
    const projectRef = adminDb.collection(PROJECTS_COLLECTION).doc(projectId);
    const slugRef = adminDb.collection(SLUGS_COLLECTION).doc(slug);
    const projectSnap = await tx.get(projectRef);
    const currentProject = projectSnap.exists
      ? (projectSnap.data() as ProjectDoc)
      : null;

    if (payload.featured && !currentProject?.featured) {
      const featuredQuery = adminDb
        .collection(PROJECTS_COLLECTION)
        .where("featured", "==", true);
      const featuredSnapshot = await tx.get(featuredQuery);
      if (featuredSnapshot.size >= MAX_FEATURED_PROJECTS) {
        throw new Error(
          `Featured projects limit reached (${MAX_FEATURED_PROJECTS}). Unfeature another project first.`
        );
      }
    }

    if (existingData?.slug && existingData.slug !== slug) {
      tx.delete(adminDb.collection(SLUGS_COLLECTION).doc(existingData.slug));
    }

    const slugSnap = await tx.get(slugRef);
    if (!slugSnap.exists) {
      tx.set(slugRef, { projectId, createdAt: now });
    }

    tx.set(projectRef, payload, { merge: true });
  });

  return { id: projectId, ...payload };
}

export async function setProjectStatus(
  id: string,
  status: "draft" | "published",
  hidden?: boolean
) {
  const adminDb = getAdminDb();
  const now = nowIsoString();
  const ref = adminDb.collection(PROJECTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Project not found");
  const current = snap.data() as ProjectDoc;

  await ref.set(
    {
      status,
      hidden: typeof hidden === "boolean" ? hidden : current.hidden,
      publishedAt: status === "published" ? current.publishedAt || now : null,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function reorderProjects(idsInOrder: string[]) {
  const adminDb = getAdminDb();
  const now = nowIsoString();
  const batch = adminDb.batch();
  const total = idsInOrder.length;

  idsInOrder.forEach((id, index) => {
    const ref = adminDb.collection(PROJECTS_COLLECTION).doc(id);
    batch.set(
      ref,
      {
        sortOrder: total - index,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  await batch.commit();
}

export async function deleteProject(id: string) {
  const adminDb = getAdminDb();
  const projectRef = adminDb.collection(PROJECTS_COLLECTION).doc(id);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new Error("Project not found");
  }

  const project = projectSnap.data() as ProjectDoc;
  const filesToDelete = new Set<string>();

  for (const mediaItem of project.media || []) {
    if (mediaItem.storagePath) {
      filesToDelete.add(mediaItem.storagePath);
    }

    if (mediaItem.thumbnailPath) {
      filesToDelete.add(mediaItem.thumbnailPath);
    }
  }

  if (
    project.coverImagePath &&
    !(await isStoragePathUsedByOtherProjects(id, "coverImagePath", project.coverImagePath))
  ) {
    filesToDelete.add(project.coverImagePath);
  }

  if (
    project.logoPath &&
    !(await isStoragePathUsedByOtherProjects(id, "logoPath", project.logoPath))
  ) {
    filesToDelete.add(project.logoPath);
  }

  await adminDb.runTransaction(async (tx) => {
    tx.delete(projectRef);
    if (project.slug) {
      tx.delete(adminDb.collection(SLUGS_COLLECTION).doc(project.slug));
    }
  });

  await deleteStoragePaths(filesToDelete);
}
