import { z } from "zod";

const mediaSourceSchema = z.object({
  url: z.string().min(1),
  type: z.string().optional(),
});

export const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  storagePath: z.string().min(1),
  thumbnailPath: z.string().optional(),
  sources: z.array(mediaSourceSchema).optional(),
});

export const projectDraftSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  logoPath: z.string().optional(),
  coverImagePath: z.string().min(1),
  media: z.array(mediaItemSchema).default([]),
  featured: z.boolean().default(false),
  hidden: z.boolean().default(false),
  sortOrder: z.number().int().optional(),
  links: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      behance: z.string().url().optional(),
    })
    .partial()
    .optional(),
});

export const projectPublishSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["draft", "published"]),
  hidden: z.boolean().optional(),
});

export const reorderSchema = z.object({
  idsInOrder: z.array(z.string().min(1)).min(1),
});
