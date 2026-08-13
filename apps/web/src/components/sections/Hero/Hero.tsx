"use client";

import { AnimatePresence, motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Hero.module.css";
import { useRouter } from "next/navigation";
import { useGetProjectsQuery } from "@/store/projectsApi";
import { selectHeroSlides } from "./heroSlides";

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { data: projects = [] } = useGetProjectsQuery();
  const [activeSlide, setActiveSlide] = useState(0);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const router = useRouter();
  const slides = useMemo(() => selectHeroSlides(projects), [projects]);

  useEffect(() => {
    setActiveSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const mediaY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.3, 0.65]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.16,
        delayChildren: 0.2,
      },
    },
  } satisfies Variants;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 16,
      },
    },
  } satisfies Variants;

  return (
    <section id="home" className={styles.hero} ref={heroRef}>
      <motion.div className={styles.mediaLayer} style={{ y: mediaY }}>
        <AnimatePresence initial={false}>
          {slides[activeSlide] && (
            <motion.div
              key={slides[activeSlide]}
              className={styles.slide}
              style={{ backgroundImage: `url("${slides[activeSlide]}")` }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className={styles.overlay}
        style={{ opacity: overlayOpacity }}
      />

      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className={styles.brand}>
          Bahaa Films
        </motion.div>

        <motion.h1 variants={itemVariants} className={styles.title}>
          Cinematic photography and films built around real moments.
        </motion.h1>

        <motion.p variants={itemVariants} className={styles.description}>
          Wedding stories, commercial visuals, and portrait sessions shaped with
          direction, light, and patient editing.
        </motion.p>

        <motion.div variants={itemVariants} className={styles.cta}>
          <button
            onClick={() => router.push("/projects")}
            className={`${styles.button} ${styles.buttonPrimary} button-glow`}
          >
            <span>Explore Work</span>
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className={`${styles.button} ${styles.buttonSecondary} button-glow`}
          >
            <span>Start a Project</span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
