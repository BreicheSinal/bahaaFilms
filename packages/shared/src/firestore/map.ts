import type { ProjectDoc, ProjectListItem, ProjectMediaSource } from "../types/project";

type Resolver = (path?: string | null) => Promise<string | undefined>;

export async function mapProjectDocForPublic(
  id: string,
  doc: ProjectDoc,
  resolvePath: Resolver
) {
  const mediaResolved = await Promise.all(
    (doc.media || []).map(async (item) => ({
      type: item.type,
      url: (await resolvePath(item.storagePath)) || item.storagePath,
      thumbnail:
        (await resolvePath(item.thumbnailPath)) || item.thumbnailPath || undefined,
      sources: item.sources?.map((source: ProjectMediaSource) => source),
    }))
  );

  return {
    id,
    ...doc,
    logo: (await resolvePath(doc.logoPath)) || doc.logoPath || undefined,
    coverImage:
      (await resolvePath(doc.coverImagePath)) ||
      doc.coverImagePath ||
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop",
    date: doc.publishedAt?.split("T")[0] || doc.updatedAt.split("T")[0],
    mediaResolved,
  };
}

export function mapProjectListItem(id: string, doc: ProjectDoc): ProjectListItem {
  return {
    id,
    slug: doc.slug,
    title: doc.title,
    status: doc.status,
    featured: doc.featured,
    hidden: doc.hidden,
    sortOrder: doc.sortOrder,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
  };
}