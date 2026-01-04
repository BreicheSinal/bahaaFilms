"use client";

import { useEffect, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard/ProjectCard";
import { fetchProjects } from "@/store/projectsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Loader from "@/components/ui/Loader/Loader";
import { navigateTo } from "@/utils/router";
import styles from "./Portfolio.module.css";

export default function Portfolio() {
  const dispatch = useAppDispatch();
  const { items: allProjects, loading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (!allProjects.length && !loading) {
      dispatch(fetchProjects());
    }
  }, [allProjects.length, dispatch, loading]);

  const featuredProjects = useMemo(
    () => allProjects.filter((project) => project.featured),
    [allProjects]
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

  return (
    <section id="portfolio" className={styles.portfolio}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.subtitle}>Featured Work</div>
          <h2 className={styles.title}>Selected Projects</h2>
          <p className={styles.description}>
            A selection of my recent photography and videography projects,
            highlighting storytelling, composition, and thoughtful editing
            across different styles and subjects.
          </p>
        </motion.div>

        {loading && featuredProjects.length === 0 ? (
          <div className={styles.loading}>
            <Loader />
          </div>
        ) : (
          <div className={styles.grid}>
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        )}

        <motion.div
          className={styles.viewAll}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <button
            className={`${styles.button} button-glow`}
            onClick={() => navigateTo("/projects")}
          >
            <span>View All Projects</span>
            <ArrowRight />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
