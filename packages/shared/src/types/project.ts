export type ProjectStatus = "draft" | "published";

export type ProjectLinkSet = {
  facebook?: string;
  instagram?: string;
  behance?: string;
};

export type ProjectMediaSource = {
  url: string;
  type?: string;
};

export type ProjectMediaItem = {
  type: "image" | "video";
  storagePath: string;
  thumbnailPath?: string;
  sources?: ProjectMediaSource[];
};

export type ProjectDoc = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  logoPath?: string;
  coverImagePath: string;
  media: ProjectMediaItem[];
  status: ProjectStatus;
  featured: boolean;
  hidden: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  links?: ProjectLinkSet;
};

export type Project = ProjectDoc & {
  id: string;
  logo?: string;
  coverImage: string;
  date: string;
  mediaResolved: Array<{
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    sources?: ProjectMediaSource[];
  }>;
};

export type ProjectDraftInput = {
  id?: string;
  slug?: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  logoPath?: string;
  coverImagePath: string;
  media: ProjectMediaItem[];
  featured: boolean;
  hidden: boolean;
  sortOrder?: number;
  links?: ProjectLinkSet;
};

export type ProjectPublishInput = {
  id: string;
  status: ProjectStatus;
  hidden?: boolean;
};

export type ProjectListItem = Pick<
  ProjectDoc,
  "slug" | "title" | "status" | "featured" | "hidden" | "sortOrder" | "updatedAt" | "publishedAt"
> & {
  id: string;
};
