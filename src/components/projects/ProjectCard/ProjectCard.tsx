"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Project } from "@/data/projects";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { navigateTo } from "@/utils/router";
import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const coverImage = project.coverImage;

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
      },
    },
  } satisfies Variants;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={styles.card}
      onClick={() => navigateTo(`/projects/${project.slug}`)}
    >
      <div className={styles.imageWrapper}>
        <ImageWithFallback
          src={coverImage}
          alt={project.title}
          className={styles.image}
        />
        <div className={styles.overlay}>
          <div className={styles.viewProject}>
            <span>View Project</span>
            <ArrowRight />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tagsRow}>
          {project.logo && (
            <ImageWithFallback
              src={project.logo}
              alt={`${project.title} logo`}
              className={styles.logo}
            />
          )}
          <div className={styles.tags}>
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <h3 className={styles.title}>{project.title}</h3>
        <p className={styles.description}>{project.shortDescription}</p>

        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(project.date)}</span>
        </div>
      </div>
    </motion.article>
  );
}
