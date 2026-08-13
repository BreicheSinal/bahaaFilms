"use client";

import { useEffect, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import Loader from "@/components/ui/Loader/Loader";
import {
  getClientProjectsHref,
  selectUniqueClients,
} from "@/components/sections/Clients/clientProjects";
import { fetchProjects, setSelectedTag } from "@/store/projectsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import styles from "./Clients.module.css";

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 18 },
  },
} satisfies Variants;

export default function Clients() {
  const dispatch = useAppDispatch();
  const { items: projects, loading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (!projects.length && !loading) {
      dispatch(fetchProjects());
    }
  }, [dispatch, loading, projects.length]);

  const clients = useMemo(() => selectUniqueClients(projects), [projects]);

  if (!loading && clients.length === 0) {
    return null;
  }

  return (
    <section id="clients" className={styles.clients} aria-labelledby="clients-title">
      <div className={styles.container}>
        <motion.header
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <p className={styles.eyebrow}>Clients</p>
          <h2 id="clients-title" className={styles.title}>
            Trusted by great people
          </h2>
        </motion.header>

        {loading && clients.length === 0 ? (
          <div className={styles.loading} aria-label="Loading clients">
            <Loader />
          </div>
        ) : (
          <div className={styles.rail} aria-label="Client logos">
            <div className={styles.track}>
              {clients.map((project, index) => (
                <motion.a
                  key={project.id}
                  href={getClientProjectsHref(project)}
                  className={styles.client}
                  aria-label={`View ${project.title} projects`}
                  onClick={() => {
                    const tag = project.tags[0]?.trim();
                    if (tag) dispatch(setSelectedTag(tag));
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
                >
                  <img
                    src={project.logo!}
                    alt=""
                    className={styles.logo}
                    loading="lazy"
                    decoding="async"
                  />
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
