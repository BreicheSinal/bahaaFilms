import {
  collection,
  getDocs,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getFirebaseServices, buildStorageUrl } from '@/lib/firebaseClient';

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  coverImage: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  date: string;
  links?: {
    github?: string;
    live?: string;
    behance?: string;
  };
  featured: boolean;
}

type ProjectRow = {
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  tags: string[] | null;
  cover_image_path?: string | null;
  cover_image_url?: string | null;
  media?: Array<{
    type: 'image' | 'video';
    path?: string;
    url?: string;
    thumbnail?: string;
  }>;
  date?: string | Timestamp | null;
  links?: {
    github?: string;
    live?: string;
    behance?: string;
  } | null;
  featured?: boolean | null;
};

function normalizeDate(value?: string | Timestamp | null) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.split('T')[0];
  }
  if (typeof (value as Timestamp).toDate === 'function') {
    const iso = (value as Timestamp).toDate().toISOString();
    return iso.split('T')[0];
  }
  return '';
}

async function mapRowToProject(
  row: ProjectRow,
  storage: FirebaseStorage | null
): Promise<Project> {
  const coverImage =
    (await buildStorageUrl(storage, row.cover_image_path)) ||
    row.cover_image_url ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop';

  const media =
    row.media &&
    (await Promise.all(
      row.media.map(async (item) => ({
        type: item.type,
        url: (await buildStorageUrl(storage, item.path)) || item.url || '',
        thumbnail: (await buildStorageUrl(storage, item.thumbnail)) || item.thumbnail,
      }))
    ));

  return {
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    tags: row.tags || [],
    coverImage,
    media: media || [],
    date: normalizeDate(row.date),
    links: row.links || undefined,
    featured: Boolean(row.featured),
  };
}

async function fetchFromFirestore(): Promise<Project[]> {
  const services = getFirebaseServices();
  if (!services) return [];

  const { db, storage } = services;

  try {
    const snapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('date', 'desc'))
    );

    const rows: ProjectRow[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<ProjectRow, 'slug'> & Partial<ProjectRow>;
      return {
        slug: (data.slug as string) || doc.id,
        ...data,
      };
    });

    return Promise.all(rows.map((row) => mapRowToProject(row, storage)));
  } catch (error) {
    console.warn('Firestore projects fallback to local data', error);
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  return fetchFromFirestore();
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await fetchFromFirestore();
  return all.filter((project) => project.featured);
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const all = await fetchFromFirestore();
  return all.find((project) => project.slug === slug);
}

export async function getProjectTags(): Promise<string[]> {
  const all = await fetchFromFirestore();
  const tagSet = new Set<string>();
  all.forEach((project) => {
    project.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
