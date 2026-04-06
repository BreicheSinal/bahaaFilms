"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { projectDraftSchema } from "@portfolio/shared/validators";
import { slugify } from "@portfolio/shared/utils/slug";
import { uploadFileToStorage } from "@/lib/upload";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProjectById,
  fetchProjects,
  upsertProject,
  type AdminProject,
} from "@/store/projectsSlice";

type EditorMode = "create" | "edit";

type MediaItem = {
  type: "image" | "video";
  storagePath: string;
  thumbnailPath?: string;
};

type FormState = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  tagsText: string;
  logoPath: string;
  coverImagePath: string;
  featured: boolean;
  hidden: boolean;
  sortOrder: number;
  facebook: string;
  instagram: string;
  behance: string;
  media: MediaItem[];
};

const MAX_FEATURED_PROJECTS = 3;

const INITIAL_STATE: FormState = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  tagsText: "",
  logoPath: "",
  coverImagePath: "",
  featured: false,
  hidden: false,
  sortOrder: 0,
  facebook: "",
  instagram: "",
  behance: "",
  media: [],
};

function toFormState(project: AdminProject): FormState {
  return {
    title: project.title || "",
    slug: project.slug || "",
    shortDescription: project.shortDescription || "",
    fullDescription: project.fullDescription || "",
    tagsText: (project.tags || []).join(", "),
    logoPath: project.logoPath || "",
    coverImagePath: project.coverImagePath || "",
    featured: Boolean(project.featured),
    hidden: Boolean(project.hidden),
    sortOrder: Number(project.sortOrder || 0),
    facebook: project.links?.facebook || "",
    instagram: project.links?.instagram || "",
    behance: project.links?.behance || "",
    media: project.media || [],
  };
}

export default function ProjectEditor({
  mode,
  projectId,
}: {
  mode: EditorMode;
  projectId?: string;
}) {
  const dispatch = useAppDispatch();
  const cachedProject = useAppSelector((state) =>
    projectId ? state.projects.byId[projectId] : undefined
  );
  const allProjects = useAppSelector((state) => state.projects.projects);
  const detailsStatus = useAppSelector((state) =>
    projectId ? state.projects.detailsStatusById[projectId] : "idle"
  );
  const storeError = useAppSelector((state) => state.projects.error);
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishAfterSave, setPublishAfterSave] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragTarget, setDragTarget] = useState<"cover" | "logo" | "media" | null>(null);
  const [isCoverPathOpen, setIsCoverPathOpen] = useState(false);
  const [isLogoPathOpen, setIsLogoPathOpen] = useState(false);
  const coverPathDropdownRef = useRef<HTMLDivElement | null>(null);
  const logoPathDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !projectId) return;
    if (cachedProject) return;
    void dispatch(fetchProjectById({ id: projectId }));
  }, [mode, projectId, cachedProject, dispatch]);

  useEffect(() => {
    void dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        coverPathDropdownRef.current &&
        !coverPathDropdownRef.current.contains(target)
      ) {
        setIsCoverPathOpen(false);
      }
      if (
        logoPathDropdownRef.current &&
        !logoPathDropdownRef.current.contains(target)
      ) {
        setIsLogoPathOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !cachedProject) return;
    setForm(toFormState(cachedProject));
  }, [mode, cachedProject]);

  const tags = useMemo(
    () =>
      form.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tagsText]
  );

  const logoPathOptions = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((project) => {
      const value = project.logoPath?.trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort();
  }, [allProjects]);

  const coverPathOptions = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((project) => {
      const value = project.coverImagePath?.trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort();
  }, [allProjects]);
  const featuredProjectsCount = useMemo(
    () => allProjects.filter((project) => project.featured).length,
    [allProjects]
  );
  const featuredLimitReached = featuredProjectsCount >= MAX_FEATURED_PROJECTS && !form.featured;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = projectDraftSchema.parse({
        id: projectId,
        slug: form.slug || slugify(form.title),
        title: form.title,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        tags,
        logoPath: form.logoPath || undefined,
        coverImagePath: form.coverImagePath,
        media: form.media,
        featured: form.featured,
        hidden: form.hidden,
        sortOrder: form.sortOrder,
        links: {
          facebook: form.facebook || undefined,
          instagram: form.instagram || undefined,
          behance: form.behance || undefined,
        },
      });

      const response = await fetch(
        mode === "edit" ? `/api/projects/${projectId}` : "/api/projects",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save project");
      if (result.project) {
        dispatch(upsertProject(result.project));
      }

      if (publishAfterSave) {
        const id = result.project?.id || projectId;
        if (id) {
          const publishResponse = await fetch(`/api/projects/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "published" }),
          });
          if (!publishResponse.ok) {
            const publishResult = await publishResponse.json();
            throw new Error(publishResult.error || "Failed to publish project");
          }
          void dispatch(fetchProjectById({ id, force: true }));
        }
      }

      router.push("/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadAsset = async (
    file: File,
    target: "coverImagePath" | "logoPath" | "media",
    mediaType: "image" | "video" = "image"
  ) => {
    const key = `${target}-${Date.now()}`;
    setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

    const safeSlug = slugify(form.slug || form.title || "draft");
    const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const path =
      target === "logoPath"
        ? `Logo/${safeName}`
        : target === "coverImagePath"
        ? `CoverImage/${safeSlug}/${safeName}`
        : `projects/${safeSlug}/${safeName}`;

    const uploaded = await uploadFileToStorage(file, path, (value) => {
      setUploadProgress((prev) => ({ ...prev, [key]: value }));
    });

    if (target === "media") {
      setForm((prev) => ({
        ...prev,
        media: [...prev.media, { type: mediaType, storagePath: uploaded.storagePath }],
      }));
    } else {
      setForm((prev) => ({ ...prev, [target]: uploaded.storagePath }));
    }

    setUploadProgress((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const uploadFromFile = async (file: File, target: "cover" | "logo" | "media") => {
    setError(null);

    if (target === "logo" && !file.type.startsWith("image/")) {
      setError("Logo must be an image file.");
      return;
    }

    if (target === "media") {
      const pickedType: "image" | "video" = file.type.startsWith("video/")
        ? "video"
        : "image";
      await uploadAsset(file, "media", pickedType);
      return;
    }

    await uploadAsset(file, target === "cover" ? "coverImagePath" : "logoPath", "image");
  };

  const onDropUpload =
    (target: "cover" | "logo" | "media") =>
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragTarget(null);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      void uploadFromFile(file, target);
    };

  const onPickUpload =
    (target: "cover" | "logo" | "media") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void uploadFromFile(file, target);
      event.target.value = "";
    };

  const loading = mode === "edit" && !cachedProject && detailsStatus !== "failed";

  if (loading) {
    return (
      <main className="container page-stack">
        <div className="card">
          <Spinner label="Loading project..." />
        </div>
      </main>
    );
  }

  return (
    <main className="container page-stack">
      <section className="card header-row project-editor-header">
        <h1 className="card-title">{mode === "edit" ? "Edit Project" : "New Project"}</h1>
        <Link href="/projects" className="back-link-inline">
          <span aria-hidden="true">{"\u2190"}</span>
          <span>Back to Projects</span>
        </Link>
      </section>

      <form className="card form-grid" onSubmit={submit}>
        <div className="grid-2">
          <div className="field-group">
            <label className="field-label" htmlFor="project-title">
              Title
            </label>
            <input
              id="project-title"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="project-slug">
              Slug
            </label>
            <input
              id="project-slug"
              placeholder="project-slug"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="project-short-description">
            Short Description
          </label>
          <input
            id="project-short-description"
            placeholder="One-line summary"
            value={form.shortDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
            }
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="project-full-description">
            Full Description
          </label>
          <textarea
            id="project-full-description"
            placeholder="Detailed project description"
            value={form.fullDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullDescription: e.target.value }))
            }
            rows={6}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="project-tags">
            Tags
          </label>
          <input
            id="project-tags"
            placeholder="Comma separated tags"
            value={form.tagsText}
            onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
          />
        </div>

        <div className="grid-2">
          <div className="field-group">
            <label className="field-label" htmlFor="project-cover-path">
              Cover Image Storage Path
            </label>
            <div className="filter-select" ref={coverPathDropdownRef}>
              <button
                id="project-cover-path"
                type="button"
                className={`filter-select-trigger ${isCoverPathOpen ? "is-open" : ""}`}
                onClick={() => {
                  setIsCoverPathOpen((prev) => !prev);
                  setIsLogoPathOpen(false);
                }}
                aria-expanded={isCoverPathOpen}
                aria-haspopup="listbox"
              >
                <span>{form.coverImagePath || "Select a cover image path"}</span>
                <span className="filter-select-chevron">{"\u25BE"}</span>
              </button>
              {isCoverPathOpen ? (
                <div
                  className="filter-select-menu"
                  role="listbox"
                  aria-label="Select cover image storage path"
                >
                  <button
                    type="button"
                    className={`filter-select-option ${form.coverImagePath === "" ? "is-active" : ""}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, coverImagePath: "" }));
                      setIsCoverPathOpen(false);
                    }}
                    role="option"
                    aria-selected={form.coverImagePath === ""}
                  >
                    Select a cover image path
                  </button>
                  {coverPathOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`filter-select-option ${form.coverImagePath === option ? "is-active" : ""}`}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, coverImagePath: option }));
                        setIsCoverPathOpen(false);
                      }}
                      role="option"
                      aria-selected={form.coverImagePath === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="project-logo-path">
              Logo Storage Path
            </label>
            <div className="filter-select" ref={logoPathDropdownRef}>
              <button
                id="project-logo-path"
                type="button"
                className={`filter-select-trigger ${isLogoPathOpen ? "is-open" : ""}`}
                onClick={() => {
                  setIsLogoPathOpen((prev) => !prev);
                  setIsCoverPathOpen(false);
                }}
                aria-expanded={isLogoPathOpen}
                aria-haspopup="listbox"
              >
                <span>{form.logoPath || "Select a logo path"}</span>
                <span className="filter-select-chevron">{"\u25BE"}</span>
              </button>
              {isLogoPathOpen ? (
                <div
                  className="filter-select-menu"
                  role="listbox"
                  aria-label="Select logo storage path"
                >
                  <button
                    type="button"
                    className={`filter-select-option ${form.logoPath === "" ? "is-active" : ""}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, logoPath: "" }));
                      setIsLogoPathOpen(false);
                    }}
                    role="option"
                    aria-selected={form.logoPath === ""}
                  >
                    Select a logo path
                  </button>
                  {logoPathOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`filter-select-option ${form.logoPath === option ? "is-active" : ""}`}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, logoPath: option }));
                        setIsLogoPathOpen(false);
                      }}
                      role="option"
                      aria-selected={form.logoPath === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="upload-grid">
          <label
            className={`upload-dropzone ${dragTarget === "cover" ? "is-dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget("cover");
            }}
            onDragLeave={() => setDragTarget((current) => (current === "cover" ? null : current))}
            onDrop={onDropUpload("cover")}
          >
            <span className="upload-title">Upload Cover</span>
            <span className="upload-hint">Drag & drop or click to browse</span>
            <input type="file" accept="image/*,video/*" onChange={onPickUpload("cover")} />
          </label>

          <label
            className={`upload-dropzone ${dragTarget === "logo" ? "is-dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget("logo");
            }}
            onDragLeave={() => setDragTarget((current) => (current === "logo" ? null : current))}
            onDrop={onDropUpload("logo")}
          >
            <span className="upload-title">Upload Logo</span>
            <span className="upload-hint">Images only</span>
            <input type="file" accept="image/*" onChange={onPickUpload("logo")} />
          </label>

          <label
            className={`upload-dropzone ${dragTarget === "media" ? "is-dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget("media");
            }}
            onDragLeave={() => setDragTarget((current) => (current === "media" ? null : current))}
            onDrop={onDropUpload("media")}
          >
            <span className="upload-title">Add Media</span>
            <span className="upload-hint">Images or videos</span>
            <input type="file" accept="image/*,video/*" onChange={onPickUpload("media")} />
          </label>
        </div>

        {Object.entries(uploadProgress).map(([key, progress]) => (
          <p className="progress-line" key={key}>
            {key}: {progress}%
          </p>
        ))}

        <div className="form-grid">
          {form.media.map((item, index) => (
            <div className="media-row" key={`${item.storagePath}-${index}`}>
              <div className="filter-select media-type-select">
                <button
                  type="button"
                  className="filter-select-trigger media-type-trigger"
                  disabled
                  aria-label="Media type (read-only)"
                >
                  <span>{item.type === "image" ? "Image" : "Video"}</span>
                </button>
              </div>
              <input
                value={item.storagePath}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    media: prev.media.map((entry, itemIndex) =>
                      itemIndex === index
                        ? { ...entry, storagePath: e.target.value }
                        : entry
                    ),
                  }))
                }
              />
              <button
                className="button-danger"
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    media: prev.media.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid-3">
          <div className="field-group">
            <label className="field-label" htmlFor="project-facebook-url">
              Facebook URL
            </label>
            <input
              id="project-facebook-url"
              placeholder="https://facebook.com/..."
              value={form.facebook}
              onChange={(e) => setForm((prev) => ({ ...prev, facebook: e.target.value }))}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="project-instagram-url">
              Instagram URL
            </label>
            <input
              id="project-instagram-url"
              placeholder="https://instagram.com/..."
              value={form.instagram}
              onChange={(e) => setForm((prev) => ({ ...prev, instagram: e.target.value }))}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="project-behance-url">
              Behance URL
            </label>
            <input
              id="project-behance-url"
              placeholder="https://www.behance.net/..."
              value={form.behance}
              onChange={(e) => setForm((prev) => ({ ...prev, behance: e.target.value }))}
            />
          </div>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              disabled={featuredLimitReached}
              onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
            />
            Featured
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.hidden}
              onChange={(e) => setForm((prev) => ({ ...prev, hidden: e.target.checked }))}
            />
            Hidden
          </label>
          <label>
            <input
              type="checkbox"
              checked={publishAfterSave}
              onChange={(e) => setPublishAfterSave(e.target.checked)}
            />
            Publish after save
          </label>
        </div>
        {featuredLimitReached ? (
          <p className="muted">
            You can feature up to {MAX_FEATURED_PROJECTS} projects. Unfeature one to add another.
          </p>
        ) : null}

        {error || storeError ? <p className="error-text">{error || storeError}</p> : null}

        <div className="actions-row modal-actions">
          <Link href="/projects">
            <button className="button-secondary" type="button">
              Cancel
            </button>
          </Link>
          <button type="submit" disabled={saving}>
            {saving ? (
              <span className="button-loading-content">
                <span className="button-spinner" aria-hidden="true" />
                <span>Saving</span>
              </span>
            ) : mode === "edit" ? (
              "Save"
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

