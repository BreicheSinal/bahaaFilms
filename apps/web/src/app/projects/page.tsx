"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { Search, Filter } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard/ProjectCard";
import Loader from "@/components/ui/Loader/Loader";
import {
  resetFilters,
  setSearchQuery,
  setSelectedTag,
} from "@/store/projectsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetProjectsQuery } from "@/store/projectsApi";
import { matchesSelectedTag } from "@/lib/projectFilters";
import styles from "./page.module.css";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { searchQuery, selectedTag } = useAppSelector(
    (state) => state.projects
  );
  const { data: allProjects = [], isLoading: loading } = useGetProjectsQuery();
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const tagRef = useRef<HTMLDivElement | null>(null);
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allProjects.forEach((project) => {
      project.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.shortDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTag = matchesSelectedTag(project.tags, selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [allProjects, searchQuery, selectedTag]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) {
        setIsTagOpen(false);
        setTagSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = useMemo(
    () =>
      allTags.filter((tag) =>
        tag.toLowerCase().includes(tagSearch.toLowerCase())
      ),
    [allTags, tagSearch]
  );

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  } satisfies Variants;

  const filterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.2,
      },
    },
  } satisfies Variants;

  return (
    <div className={styles.projects}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.subtitle}>Portfolio</div>
          <h1 className={styles.title}>All Projects</h1>
          <p className={styles.description}>
            A full archive of films and photography projects, organized by
            story type, visual mood, and production direction.
          </p>
        </motion.div>

        <motion.div
          className={styles.filters}
          variants={filterVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or description"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.tagFilters}>
              <div className={styles.selectTriggerRow}>
                <div className={styles.filterLabel}>
                  <Filter />
                  <span>Filter by tag</span>
                </div>
                <div className={styles.selectWrapper} ref={tagRef}>
                  <button
                    type="button"
                    className={styles.selectTrigger}
                    onClick={() => setIsTagOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isTagOpen}
                  >
                    <span>{selectedTag}</span>
                    <span className={styles.selectChevron}>▾</span>
                  </button>
                  {isTagOpen && (
                    <div className={styles.tagList} role="listbox">
                      <div className={styles.tagSearch}>
                        <input
                          type="text"
                          placeholder="Search tags..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                        />
                      </div>
                      <button
                        className={`${styles.tagOption} ${
                          selectedTag === "All" ? styles.activeOption : ""
                        }`}
                        onClick={() => {
                          dispatch(setSelectedTag("All"));
                          setTagSearch("");
                          setIsTagOpen(false);
                        }}
                      >
                        All
                      </button>
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          className={`${styles.tagOption} ${
                            selectedTag === tag ? styles.activeOption : ""
                          }`}
                          onClick={() => {
                            dispatch(setSelectedTag(tag));
                            setTagSearch("");
                            setIsTagOpen(false);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                      {filteredTags.length === 0 && (
                        <div className={styles.emptyTags}>No tags found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!loading && (
            <div className={styles.count}>
              {filteredProjects.length} project
              {filteredProjects.length === 1 ? "" : "s"} found
            </div>
          )}
        </motion.div>

        {loading ? (
          <motion.div
            className={styles.loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader />
          </motion.div>
        ) : filteredProjects.length > 0 ? (
          <motion.div
            className={styles.grid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </motion.div>
        ) : allProjects.length === 0 ? (
          <motion.div
            className={styles.noResults}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p>No projects yet.</p>
          </motion.div>
        ) : (
          <motion.div
            className={styles.noResults}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p>No projects found matching your criteria.</p>
            <button
              onClick={() => {
                dispatch(resetFilters());
              }}
              className={styles.resetButton}
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
