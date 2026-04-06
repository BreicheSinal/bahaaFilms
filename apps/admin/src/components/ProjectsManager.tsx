"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProjects, setProjects } from "@/store/projectsSlice";
import type { AdminProject } from "@/store/projectsSlice";
import {
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  HideIcon,
  KebabIcon,
  PublishIcon,
} from "@/components/ui/ActionIcons";

export default function ProjectsManager({
  adminEmail,
}: {
  adminEmail: string;
}) {
  const dispatch = useAppDispatch();
  const {
    projects,
    listStatus,
    error: loadError,
  } = useAppSelector((state) => state.projects);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [iconLoading, setIconLoading] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published" | "featured">("all");
  const [tag, setTag] = useState("all");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);
  const loading = listStatus === "loading" && projects.length === 0;
  const error = actionError || loadError;

  useEffect(() => {
    void dispatch(fetchProjects());
  }, [dispatch]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) =>
      project.tags?.forEach((item) => set.add(item)),
    );
    return ["all", ...Array.from(set).sort()];
  }, [projects]);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(target)
      ) {
        setIsStatusOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(target)) {
        setIsTagOpen(false);
      }
      const clickedInsideMobileMenu =
        target instanceof Element
          ? Boolean(target.closest(".mobile-actions-menu-wrap"))
          : false;
      if (!clickedInsideMobileMenu) {
        setOpenRowMenuId(null);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !search ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        status === "all" ||
        (status === "featured" && project.featured) ||
        project.status === status;
      const matchesTag = tag === "all" || project.tags?.includes(tag);
      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [projects, search, status, tag]);

  const patchProject = async (id: string, body: Record<string, unknown>) => {
    setActionError(null);
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Failed to update");
  };

  const setActionLoading = (
    id: string,
    action: "publish" | "hide",
    value: boolean,
  ) => {
    const key = `${id}:${action}`;
    setIconLoading((prev) => ({ ...prev, [key]: value }));
  };

  const isActionLoading = (id: string, action: "publish" | "hide") =>
    Boolean(iconLoading[`${id}:${action}`]);

  const runProjectAction = async (
    id: string,
    action: "publish" | "hide",
    body: Record<string, unknown>,
  ) => {
    setActionLoading(id, action, true);
    try {
      await patchProject(id, body);
      await dispatch(fetchProjects({ force: true }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update project",
      );
    } finally {
      setActionLoading(id, action, false);
    }
  };

  const removeProject = async (id: string) => {
    setActionError(null);
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error || "Failed to delete project");
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;

    setDeleting(true);
    try {
      await removeProject(pendingDelete.id);
      setPendingDelete(null);
      await dispatch(fetchProjects({ force: true }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    } finally {
      setDeleting(false);
    }
  };

  const persistOrder = async (next: AdminProject[]) => {
    dispatch(setProjects(next));
    try {
      const response = await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idsInOrder: next.map((project) => project.id) }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to reorder projects");
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to reorder projects",
      );
    }
  };

  const onRowDrop = async (targetId: string) => {
    if (!draggedProjectId || draggedProjectId === targetId) return;

    const fromIndex = projects.findIndex(
      (project) => project.id === draggedProjectId,
    );
    const toIndex = projects.findIndex((project) => project.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...projects];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setDraggedProjectId(null);
    await persistOrder(next);
  };

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (auth) {
      await signOut(auth);
    }
    window.location.href = "/login";
  };

  return (
    <main className="container page-stack">
      <section className="card header-row">
        <div>
          <h1 className="card-title">Bahaa Films Admin</h1>
          <p className="muted">Signed in as {adminEmail}</p>
        </div>
        <div className="actions-row projects-header-actions">
          <Link href="/projects/new">
            <button>New Project</button>
          </Link>
          <button className="button-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="card form-grid">
        <div className="grid-3 projects-filters">
          <input
            placeholder="Search by title or slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-select" ref={statusDropdownRef}>
            <button
              type="button"
              className={`filter-select-trigger ${isStatusOpen ? "is-open" : ""}`}
              onClick={() => {
                setIsStatusOpen((prev) => !prev);
                setIsTagOpen(false);
              }}
              aria-expanded={isStatusOpen}
              aria-haspopup="listbox"
            >
              <span>
                {status === "all"
                  ? "All statuses"
                  : status === "featured"
                    ? "Featured"
                  : status === "draft"
                    ? "Unpublished"
                    : "Published"}
              </span>
              <span className="filter-select-chevron">{"\u25BE"}</span>
            </button>
            {isStatusOpen ? (
              <div
                className="filter-select-menu"
                role="listbox"
                aria-label="Filter by status"
              >
                {[
                  { value: "all", label: "All statuses" },
                  { value: "featured", label: "Featured" },
                  { value: "draft", label: "Unpublished" },
                  { value: "published", label: "Published" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-select-option ${status === option.value ? "is-active" : ""}`}
                    onClick={() => {
                      setStatus(option.value as typeof status);
                      setIsStatusOpen(false);
                    }}
                    role="option"
                    aria-selected={status === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="filter-select" ref={tagDropdownRef}>
            <button
              type="button"
              className={`filter-select-trigger ${isTagOpen ? "is-open" : ""}`}
              onClick={() => {
                setIsTagOpen((prev) => !prev);
                setIsStatusOpen(false);
              }}
              aria-expanded={isTagOpen}
              aria-haspopup="listbox"
            >
              <span>{tag === "all" ? "All tags" : tag}</span>
              <span className="filter-select-chevron">{"\u25BE"}</span>
            </button>
            {isTagOpen ? (
              <div
                className="filter-select-menu"
                role="listbox"
                aria-label="Filter by tag"
              >
                {tags.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`filter-select-option ${tag === option ? "is-active" : ""}`}
                    onClick={() => {
                      setTag(option);
                      setIsTagOpen(false);
                    }}
                    role="option"
                    aria-selected={tag === option}
                  >
                    {option === "all" ? "All tags" : option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {loading ? <Spinner label="Loading projects..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th aria-label="Drag handle" />
                <th>Title</th>
                <th>Status</th>
                <th className="flags-column-header">Flags</th>
                <th className="actions-column-header">Actions</th>
                <th
                  className="delete-column-header"
                  aria-label="Delete actions"
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  draggable
                  className={
                    draggedProjectId === project.id ? "is-dragging-row" : ""
                  }
                  onDragStart={() => setDraggedProjectId(project.id)}
                  onDragEnd={() => setDraggedProjectId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => void onRowDrop(project.id)}
                >
                  <td className="drag-cell" title="Drag to reorder">
                    <DragHandleIcon className="action-icon drag-handle-icon" />
                  </td>
                  <td>
                    <strong>{project.title}</strong>
                    <div className="meta-line">{project.slug}</div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${project.status}`}
                      aria-label={
                        project.status === "published"
                          ? "Published"
                          : "Unpublished"
                      }
                    >
                      <span className="status-text">
                        {project.status === "published"
                          ? "Published"
                          : "Unpublished"}
                      </span>
                    </span>
                  </td>
                  <td className="flags-cell">
                    {project.featured ? "Featured " : ""}
                    {project.hidden ? "Hidden" : "Visible"}
                  </td>
                  <td>
                    <div className="inline-actions desktop-row-actions">
                      <Link href={`/projects/${project.id}`}>
                        <button
                          className="icon-button button-secondary"
                          aria-label="Edit project"
                          title="Edit project"
                        >
                          <EditIcon className="action-icon" />
                        </button>
                      </Link>
                      <button
                        className="icon-button"
                        aria-label={
                          project.status === "published"
                            ? "Unpublish project"
                            : "Publish project"
                        }
                        title={
                          project.status === "published"
                            ? "Unpublish project"
                            : "Publish project"
                        }
                        onClick={() =>
                          void runProjectAction(project.id, "publish", {
                            status:
                              project.status === "published"
                                ? "draft"
                                : "published",
                          })
                        }
                        disabled={isActionLoading(project.id, "publish")}
                      >
                        {isActionLoading(project.id, "publish") ? (
                          <span className="button-spinner" aria-hidden="true" />
                        ) : (
                          <PublishIcon className="action-icon" />
                        )}
                      </button>
                      <button
                        className="icon-button button-secondary"
                        aria-label={
                          project.hidden ? "Unhide project" : "Hide project"
                        }
                        title={
                          project.hidden ? "Unhide project" : "Hide project"
                        }
                        onClick={() =>
                          void runProjectAction(project.id, "hide", {
                            status: project.status,
                            hidden: !project.hidden,
                          })
                        }
                        disabled={isActionLoading(project.id, "hide")}
                      >
                        {isActionLoading(project.id, "hide") ? (
                          <span className="button-spinner" aria-hidden="true" />
                        ) : (
                          <HideIcon className="action-icon" />
                        )}
                      </button>
                    </div>
                    <div className="mobile-actions-menu-wrap">
                      <button
                        type="button"
                        className="icon-button button-secondary mobile-actions-trigger"
                        aria-label="Open actions menu"
                        title="Open actions menu"
                        onClick={() =>
                          setOpenRowMenuId((current) =>
                            current === project.id ? null : project.id,
                          )
                        }
                      >
                        <KebabIcon className="action-icon" />
                      </button>
                      {openRowMenuId === project.id ? (
                        <div className="mobile-actions-menu">
                          <div className="mobile-actions-meta">
                            <span className="mobile-actions-meta-title">Flags</span>
                            <span className="mobile-actions-meta-values">
                              {project.featured ? "Featured" : ""}{" "}
                              {project.hidden ? "Hidden" : "Visible"}
                            </span>
                          </div>
                          <Link href={`/projects/${project.id}`}>
                            <button
                              type="button"
                              className="mobile-actions-option"
                              onClick={() => setOpenRowMenuId(null)}
                            >
                              Edit
                            </button>
                          </Link>
                          <button
                            type="button"
                            className="mobile-actions-option"
                            onClick={() =>
                              void runProjectAction(project.id, "publish", {
                                status:
                                  project.status === "published"
                                    ? "draft"
                                    : "published",
                              }).then(() => setOpenRowMenuId(null))
                            }
                            disabled={isActionLoading(project.id, "publish")}
                          >
                            {project.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </button>
                          <button
                            type="button"
                            className="mobile-actions-option"
                            onClick={() =>
                              void runProjectAction(project.id, "hide", {
                                status: project.status,
                                hidden: !project.hidden,
                              }).then(() => setOpenRowMenuId(null))
                            }
                            disabled={isActionLoading(project.id, "hide")}
                          >
                            {project.hidden ? "Unhide" : "Hide"}
                          </button>
                          <button
                            type="button"
                            className="mobile-actions-option mobile-actions-option-danger"
                            onClick={() => {
                              setPendingDelete({
                                id: project.id,
                                title: project.title,
                              });
                              setOpenRowMenuId(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="desktop-delete-action">
                    <button
                      className="icon-button button-danger"
                      aria-label="Delete project"
                      title="Delete project"
                      onClick={() =>
                        setPendingDelete({
                          id: project.id,
                          title: project.title,
                        })
                      }
                    >
                      <DeleteIcon className="action-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {pendingDelete ? (
        <div
          className="modal-overlay"
          onClick={() => !deleting && setPendingDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-project-title" className="modal-title">
              Delete Project
            </h2>
            <p className="muted">
              Delete &quot;{pendingDelete.title}&quot;? This action cannot be
              undone.
            </p>
            <div className="actions-row modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="button-loading-content">
                    <span className="button-spinner" aria-hidden="true" />
                    <span>Deleting</span>
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
