"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useGetProjectsQuery } from "@/store/projectsApi";
import { shouldRevealIntro } from "./introReadiness";
import { getIntroExitTransition } from "./introTransition";
import { getGreetingDelay } from "./greetingPacing";
import styles from "./CinematicIntro.module.css";

const GREETINGS = ["Hello", "Bonjour", "Hola", "Ciao", "Hallo", "Marhaba", "こんにちは"];
const MIN_DURATION_MS = 4600;
const MAX_DURATION_MS = 7000;
const LOGO_HOLD_MS = 1000;

type CinematicIntroProps = {
  onExit: () => void;
};

export default function CinematicIntro({ onExit }: CinematicIntroProps) {
  const { isLoading, isSuccess, isError } = useGetProjectsQuery();
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const startTime = useRef(Date.now());
  const completed = useRef(false);

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setShowLogo(true);
  }, []);

  useEffect(() => {
    const isRequestSettled = isSuccess || isError || !isLoading;
    const elapsedMs = Date.now() - startTime.current;

    if (shouldRevealIntro({ elapsedMs, isRequestSettled, minDurationMs: MIN_DURATION_MS, maxDurationMs: MAX_DURATION_MS })) {
      complete();
      return;
    }

    const nextCheckMs = Math.min(
      Math.max(MIN_DURATION_MS - elapsedMs, 0),
      Math.max(MAX_DURATION_MS - elapsedMs, 0)
    );
    const timer = window.setTimeout(complete, nextCheckMs || 1);
    return () => window.clearTimeout(timer);
  }, [complete, isError, isLoading, isSuccess]);

  useEffect(() => {
    if (showLogo) return;
    const timer = window.setTimeout(
      () => setGreetingIndex((current) => (current + 1) % GREETINGS.length),
      getGreetingDelay(greetingIndex)
    );
    return () => window.clearTimeout(timer);
  }, [greetingIndex, showLogo]);

  useEffect(() => {
    if (!showLogo) return;
    const timer = window.setTimeout(onExit, LOGO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [onExit, showLogo]);

  return (
    <motion.div
      className={styles.intro}
      initial={{ opacity: 1 }}
      exit={getIntroExitTransition(false)}
      transition={{ duration: getIntroExitTransition(false).duration, ease: [0.65, 0, 0.35, 1] }}
      role="status"
      aria-label="Loading Bahaa Films"
    >
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.shutter} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} style={{ "--blade": index } as CSSProperties} />
        ))}
      </div>

      <div className={styles.frame}>
        <span className={styles.recording}><i /> REC</span>
        <span className={styles.timecode}>00:00:24:12</span>
        <span className={styles.format}>PHOTO / FILM</span>
      </div>

      <AnimatePresence mode="wait">
        {!showLogo ? (
          <motion.p
            key={greetingIndex}
            className={styles.greeting}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(5px)" }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            {GREETINGS[greetingIndex]}
          </motion.p>
        ) : (
          <motion.img
            key="bahaa-films-logo"
            className={styles.logo}
            src="/bh-logo-white.png"
            alt="Bahaa Films"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
