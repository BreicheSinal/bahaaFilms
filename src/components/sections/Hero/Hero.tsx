"use client";

import { motion, type Variants } from "motion/react";
import styles from "./Hero.module.css";

export default function Hero() {
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
        staggerChildren: 0.2,
        delayChildren: 0.3,
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
        stiffness: 100,
        damping: 15,
      },
    },
  } satisfies Variants;

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.background} />
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className={styles.subtitle}>
          Welcome to my portfolio
        </motion.div>

        <motion.h1 variants={itemVariants} className={styles.title}>
          Photography • Videography • Editing
        </motion.h1>

        <motion.p variants={itemVariants} className={styles.description}>
          I capture moments through photos and videos, focusing on real stories,
          clean visuals, and meaningful details.
        </motion.p>

        <motion.div variants={itemVariants} className={styles.cta}>
          <button
            onClick={() => scrollToSection("portfolio")}
            className={`${styles.button} ${styles.buttonPrimary} button-glow`}
          >
            <span>View Portfolio</span>
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className={`${styles.button} ${styles.buttonSecondary} button-glow`}
          >
            <span>Contact Me</span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
