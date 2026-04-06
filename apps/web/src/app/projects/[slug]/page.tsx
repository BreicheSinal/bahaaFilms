'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, Calendar, ExternalLink, Facebook, Instagram } from 'lucide-react';
import ProjectGallery from '@/components/projects/ProjectGallery/ProjectGallery';
import ProjectCard from '@/components/projects/ProjectCard/ProjectCard';
import Loader from '@/components/ui/Loader/Loader';
import { fetchProjects } from '@/store/projectsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './page.module.css';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { items: allProjects, loading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (!allProjects.length && !loading) {
      dispatch(fetchProjects());
    }
  }, [allProjects.length, dispatch, loading]);

  const project =
    allProjects.find((item) => item.slug === params.slug) ?? null;

  const relatedProjects = project
    ? allProjects
        .filter(
          (item) =>
            item.slug !== project.slug &&
            item.tags.some((tag) => project.tags.includes(tag))
        )
        .slice(0, 3)
    : [];

  if (loading) {
    return (
      <div className={styles.project}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <Loader />
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
                router.push('/projects');
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
  } satisfies Variants;

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
  } satisfies Variants;

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
  } satisfies Variants;

  return (
    <div className={styles.project}>
      <div className={styles.container}>
        <motion.a
          href="/projects"
          onClick={(e) => {
            e.preventDefault();
            router.push('/projects');
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

          <ProjectGallery media={project.media} />

          {project.links && (
            <div className={styles.links}>
              {project.links.facebook && (
                <a
                  href={project.links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <Facebook />
                  <span>View Facebook</span>
                </a>
              )}
              {project.links.instagram && (
                <a
                  href={project.links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.secondary}`}
                >
                  <Instagram />
                  <span>View Instagram</span>
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
