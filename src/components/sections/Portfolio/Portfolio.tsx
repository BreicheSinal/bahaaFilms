"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getFeaturedProjects } from "@/data/projects";
import ProjectCard from "@/components/projects/ProjectCard/ProjectCard";
import { navigateTo } from "@/utils/router";
import styles from "./Portfolio.module.css";

export default function Portfolio() {
  const featuredProjects = getFeaturedProjects();

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
  };

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

        <div className={styles.grid}>
          {featuredProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

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
