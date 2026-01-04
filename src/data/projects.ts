import {
  collection,
  getDocs,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { getFirebaseServices, buildStorageUrl } from "@/lib/firebaseClient";

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
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
    github?: string;
    live?: string;
    behance?: string;
  };
  featured: boolean;
  hide: boolean;
}

type ProjectRow = {
  slug?: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  tags?: string[] | null;
  coverImage?: string | null;
  media?:
    | Array<{
        type: "image" | "video" | "video/mp4";
        url?: string;
        thumbnail?: string;
        sources?: Array<{
          url?: string;
          type?: string;
        }>;
      }>
    | {
        type: "image" | "video" | "video/mp4";
        url?: string;
        thumbnail?: string;
        sources?: Array<{
          url?: string;
          type?: string;
        }>;
      }
    | null;
  date?: string | Timestamp | null;
  links?: {
    github?: string;
    live?: string;
    behance?: string;
  } | null;
  featured?: boolean | null;
  hide: boolean;
};

function normalizeDate(value?: string | Timestamp | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.split("T")[0];
  }
  if (typeof (value as Timestamp).toDate === "function") {
    const iso = (value as Timestamp).toDate().toISOString();
    return iso.split("T")[0];
  }
  return "";
}

async function mapRowToProject(
  row: ProjectRow,
  storage: FirebaseStorage | null,
  fallbackSlug: string
): Promise<Project> {
  const resolvedCoverImage =
    (await buildStorageUrl(storage, row.coverImage)) ||
    row.coverImage ||
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop";

  const mediaItems = Array.isArray(row.media)
    ? row.media
    : row.media
    ? [row.media]
    : [];

  const media = await Promise.all(
    mediaItems.map(async (item) => ({
      type: item.type === "video/mp4" ? "video" : item.type,
      url: (await buildStorageUrl(storage, item.url)) || item.url || "",
      thumbnail:
        (await buildStorageUrl(storage, item.thumbnail)) || item.thumbnail,
      sources: item.sources
        ? await Promise.all(
            item.sources.map(async (source) => ({
              url:
                (await buildStorageUrl(storage, source.url)) ||
                source.url ||
                "",
              type: source.type,
            }))
          )
        : undefined,
    }))
  );

  const getFileExtension = (url?: string) => {
    if (!url) return "";
    const cleanUrl = url.split("?")[0];
    return cleanUrl.split(".").pop()?.toLowerCase() ?? "";
  };

  const isVideoUrl = (url?: string) => {
    const extension = getFileExtension(url);
    return ["mp4", "m4v", "mov", "webm"].includes(extension);
  };

  const coverImage = isVideoUrl(resolvedCoverImage)
    ? media.find((item) => item.type === "image" && item.url)?.url ||
      media.find((item) => item.type === "video" && item.thumbnail)
        ?.thumbnail ||
      resolvedCoverImage
    : resolvedCoverImage;

  return {
    slug: row.slug || fallbackSlug,
    title: row.title || "",
    shortDescription: row.shortDescription || "",
    fullDescription: row.fullDescription || "",
    tags: row.tags || [],
    coverImage,
    media,
    date: normalizeDate(row.date),
    links: row.links || undefined,
    featured: Boolean(row.featured),
    hide: Boolean(row.hide),
  };
}

async function fetchFromFirestore(): Promise<Project[]> {
  const services = getFirebaseServices();
  if (!services) return [];

  const { db, storage } = services;

  try {
    const snapshot = await getDocs(
      query(collection(db, "projects"), orderBy("date", "desc"))
    );

    const rows: Array<{ id: string; data: ProjectRow }> = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        data: doc.data() as ProjectRow,
      })
    );

    return Promise.all(
      rows.map((row) => mapRowToProject(row.data, storage, row.id))
    );
  } catch (error) {
    console.warn("Firestore projects fallback to local data", error);
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  const all = await fetchFromFirestore();
  return all.filter((project) => !project.hide);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await fetchFromFirestore();
  return all.filter((project) => project.featured && !project.hide);
}

export async function getProjectBySlug(
  slug: string
): Promise<Project | undefined> {
  const all = await fetchFromFirestore();
  return all.find((project) => project.slug === slug && !project.hide);
}

export async function getProjectTags(): Promise<string[]> {
  const all = await fetchFromFirestore();
  const visible = all.filter((project) => !project.hide);
  const tagSet = new Set<string>();
  visible.forEach((project) => {
    project.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
