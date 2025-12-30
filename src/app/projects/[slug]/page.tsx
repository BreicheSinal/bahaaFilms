'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, ExternalLink, Github } from 'lucide-react';
import { getProjectBySlug, getProjects, type Project } from '@/data/projects';
import ProjectGallery from '@/components/projects/ProjectGallery/ProjectGallery';
import ProjectCard from '@/components/projects/ProjectCard/ProjectCard';
import { navigateTo } from '@/utils/router';
import styles from './page.module.css';

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getProjectBySlug(params.slug).then((res) => {
      if (isMounted) {
        setProject(res ?? null);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [params.slug]);

  useEffect(() => {
    if (!project) return;
    let isMounted = true;
    getProjects().then((all) => {
      if (!isMounted) return;
      const related = all
        .filter(
          (p) =>
            p.slug !== project.slug &&
            p.tags.some((tag) => project.tags.includes(tag))
        )
        .slice(0, 3);
      setRelatedProjects(related);
    });
    return () => {
      isMounted = false;
    };
  }, [project]);

  if (loading) {
    return (
      <div className={styles.project}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Loading project...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.project}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Project not found</h1>
            <p className={styles.description}>
              The project you are looking for does not exist. Please return to the projects list.
            </p>
            <a
              href="/projects"
              className={styles.link}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/projects');
              }}
            >
              <ArrowLeft />
              <span>Back to Projects</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get related projects (same tags, exclude current)
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 0.3,
      },
    },
  };

  return (
    <div className={styles.project}>
      <div className={styles.container}>
        <motion.a
          href="/projects"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/projects');
          }}
          className={styles.back}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft />
          <span>Back to Projects</span>
        </motion.a>

        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.meta}>
            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.date}>
              <Calendar />
              <span>{formatDate(project.date)}</span>
            </div>
          </div>

          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.description}>{project.shortDescription}</p>

          {project.links && (
            <div className={styles.links}>
              {project.links.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <ExternalLink />
                  <span>View Live</span>
                </a>
              )}
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.secondary}`}
                >
                  <Github />
                  <span>View Code</span>
                </a>
              )}
              {project.links.behance && (
                <a
                  href={project.links.behance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.secondary}`}
                >
                  <ExternalLink />
                  <span>View on Behance</span>
                </a>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          className={styles.coverImage}
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <img src={project.coverImage} alt={project.title} />
        </motion.div>

        <motion.div
          className={styles.content}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About the Project</h2>
            <p>{project.fullDescription}</p>
          </div>
        </motion.div>

        <ProjectGallery media={project.media} />

        {relatedProjects.length > 0 && (
          <div className={styles.relatedProjects}>
            <h2 className={styles.relatedTitle}>Related Projects</h2>
            <div className={styles.grid}>
              {relatedProjects.map((relatedProject, index) => (
                <ProjectCard
                  key={relatedProject.slug}
                  project={relatedProject}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
