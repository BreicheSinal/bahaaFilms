import {
  collection,
  getDocs,
  query,
  type Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { ProjectDoc } from "@portfolio/shared/types";
import { publicProjectsQuery } from "@portfolio/shared/firestore/queries";
import { mapProjectDocForPublic } from "@portfolio/shared/firestore/map";
import { buildUniqueSlug, slugify } from "@portfolio/shared/utils/slug";
import { toISODate } from "@portfolio/shared/utils/date";
import { getFirebaseServices, buildStorageUrl } from "@/lib/firebaseClient";

export type Project = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  logo?: string;
  coverImage: string;
  media: Array<{
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    sources?: Array<{
      url: string;
      type?: string;
    }>;
  }>;
  date: string;
  links?: {
    facebook?: string;
    instagram?: string;
    behance?: string;
  };
  featured: boolean;
  hidden: boolean;
  status: "draft" | "published";
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type LegacyProjectRow = {
  slug?: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  tags?: string[] | null;
  logo?: string | null;
  coverImage?: string | null;
  coverImagePath?: string | null;
  logoPath?: string | null;
  media?:
    | Array<{
        type: "image" | "video" | "video/mp4";
        url?: string;
        storagePath?: string;
        thumbnail?: string;
        thumbnailPath?: string;
        sources?: Array<{
          url?: string;
          type?: string;
        }>;
      }>
    | {
        type: "image" | "video" | "video/mp4";
        url?: string;
        storagePath?: string;
        thumbnail?: string;
        thumbnailPath?: string;
        sources?: Array<{
          url?: string;
          type?: string;
        }>;
      }
    | null;
  date?: string | Timestamp | null;
  publishedAt?: string | Timestamp | null;
  createdAt?: string | Timestamp | null;
  updatedAt?: string | Timestamp | null;
  sortOrder?: number | null;
  links?: {
    facebook?: string;
    instagram?: string;
    behance?: string;
    live?: string;
    github?: string;
  } | null;
  featured?: boolean | null;
  hide?: boolean | null;
  hidden?: boolean | null;
  status?: "draft" | "published" | null;
};

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function hasKnownStoragePrefix(path: string): boolean {
  return (
    path.toLowerCase().startsWith("projects/") ||
    path.startsWith("CoverImage/") ||
    path.startsWith("Logo/")
  );
}

function normalizeLegacyMediaPath(path?: string): string {
  const value = (path || "").trim();
  if (!value) return "";
  if (isAbsoluteUrl(value) || value.startsWith("/")) return value;
  if (hasKnownStoragePrefix(value)) return value;
  return `projects/${value.replace(/^\/+/, "")}`;
}

function normalizeLegacySourceUrl(
  sourceUrl: string | undefined,
  fallbackStoragePath: string
): string {
  const value = (sourceUrl || "").trim();
  if (!value) return "";
  if (isAbsoluteUrl(value) || value.startsWith("/") || hasKnownStoragePrefix(value)) {
    return value;
  }

  // Legacy docs sometimes keep a stale folder here (e.g. "Solar/...").
  // Prefer the canonical media storagePath for source playback.
  return fallbackStoragePath || normalizeLegacyMediaPath(value);
}

function normalizeDateTime(value?: string | Timestamp | Date | null): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return new Date(value).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return new Date().toISOString();
}

function buildDocFromRow(row: LegacyProjectRow, fallbackSlug: string): ProjectDoc {
  const usedSlug = row.slug || fallbackSlug;

  const normalizedMedia = (Array.isArray(row.media)
    ? row.media
    : row.media
    ? [row.media]
    : []
  ).map((item) => {
    const normalizedStoragePath = normalizeLegacyMediaPath(
      item.storagePath || item.url || ""
    );

    return {
      type: item.type === "video/mp4" ? "video" : item.type,
      storagePath: normalizedStoragePath,
      thumbnailPath:
        normalizeLegacyMediaPath(item.thumbnailPath || item.thumbnail || undefined) ||
        undefined,
      sources: item.sources
        ?.filter((source) => Boolean(source.url))
        .map((source) => ({
          url: normalizeLegacySourceUrl(source.url || "", normalizedStoragePath),
          type: source.type,
        })),
    };
  });

  const createdAt = normalizeDateTime(row.createdAt || row.date);
  const updatedAt = normalizeDateTime(row.updatedAt || row.date);
  const publishedAt = row.publishedAt
    ? normalizeDateTime(row.publishedAt)
    : row.date
    ? normalizeDateTime(row.date)
    : null;

  return {
    slug: usedSlug,
    title: row.title || "",
    shortDescription: row.shortDescription || "",
    fullDescription: row.fullDescription || "",
    tags: row.tags || [],
    logoPath: row.logoPath || row.logo || undefined,
    coverImagePath: row.coverImagePath || row.coverImage || "",
    media: normalizedMedia,
    status: row.status || "published",
    featured: Boolean(row.featured),
    hidden: Boolean(row.hidden ?? row.hide),
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    publishedAt,
    createdAt,
    updatedAt,
    links: row.links
      ? {
          facebook: row.links.facebook || row.links.live || undefined,
          instagram: row.links.instagram || row.links.github || undefined,
          behance: row.links.behance || undefined,
        }
      : undefined,
  };
}

async function mapRowToProject(
  id: string,
  row: LegacyProjectRow,
  storage: FirebaseStorage | null
): Promise<Project> {
  const doc = buildDocFromRow(row, id);
  const mapped = await mapProjectDocForPublic(id, doc, async (path) =>
    buildStorageUrl(storage, path)
  );

  return {
    id: mapped.id,
    slug: mapped.slug,
    title: mapped.title,
    shortDescription: mapped.shortDescription,
    fullDescription: mapped.fullDescription,
    tags: mapped.tags,
    logo: mapped.logo,
    coverImage: mapped.coverImage,
    media: mapped.mediaResolved,
    date: toISODate(mapped.publishedAt || mapped.updatedAt),
    links: mapped.links,
    featured: mapped.featured,
    hidden: mapped.hidden,
    status: mapped.status,
    sortOrder: mapped.sortOrder,
    publishedAt: mapped.publishedAt,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

async function fetchProjectsRaw(
  constraints: QueryConstraint[] = publicProjectsQuery()
): Promise<Project[]> {
  const services = getFirebaseServices();
  if (!services) return [];

  const { db, storage } = services;

  try {
    const snapshot = await getDocs(query(collection(db, "projects"), ...constraints));

    const items = await Promise.all(
      snapshot.docs.map((docSnap) =>
        mapRowToProject(docSnap.id, docSnap.data() as LegacyProjectRow, storage)
      )
    );

    const slugs = new Set<string>();
    return items.map((item) => {
      if (!item.slug) {
        const generated = buildUniqueSlug(item.title || item.id, slugs);
        slugs.add(generated);
        return { ...item, slug: generated };
      }

      const normalized = slugify(item.slug);
      if (!normalized || slugs.has(normalized)) {
        const generated = buildUniqueSlug(item.slug || item.title || item.id, slugs);
        slugs.add(generated);
        return { ...item, slug: generated };
      }

      slugs.add(normalized);
      return { ...item, slug: normalized };
    });
  } catch (error) {
    console.warn("Firestore projects fallback to empty list", error);
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  return fetchProjectsRaw();
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await fetchProjectsRaw();
  return all.filter((project) => project.featured);
}

export async function getProjectBySlug(
  slug: string
): Promise<Project | undefined> {
  const all = await fetchProjectsRaw();
  return all.find((project) => project.slug === slug);
}

export async function getProjectTags(): Promise<string[]> {
  const all = await fetchProjectsRaw();
  const tagSet = new Set<string>();
  all.forEach((project) => {
    project.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
