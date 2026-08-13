"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useGetProjectsQuery } from "@/store/projectsApi";
import { shouldRevealIntro } from "./introReadiness";
import { getIntroExitTransition } from "./introTransition";
import { INTRO_TIMING } from "./introTiming";
import styles from "./CinematicIntro.module.css";

type CinematicIntroProps = {
  onExit: () => void;
};

export default function CinematicIntro({ onExit }: CinematicIntroProps) {
  const { isLoading, isSuccess, isError } = useGetProjectsQuery();
  const [checkTime, setCheckTime] = useState(0);
  const startTime = useRef(Date.now());
  const completed = useRef(false);

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onExit();
  }, [onExit]);

  useEffect(() => {
    const isRequestSettled = isSuccess || isError || !isLoading;
    const elapsedMs = Date.now() - startTime.current;

    if (shouldRevealIntro({
      elapsedMs,
      isRequestSettled,
      minDurationMs: INTRO_TIMING.minDurationMs,
      maxDurationMs: INTRO_TIMING.maxDurationMs,
    })) {
      complete();
      return;
    }

    const nextCheckMs = elapsedMs < INTRO_TIMING.minDurationMs
      ? INTRO_TIMING.minDurationMs - elapsedMs
      : INTRO_TIMING.maxDurationMs - elapsedMs;
    const timer = window.setTimeout(
      () => setCheckTime(Date.now()),
      Math.max(nextCheckMs, 1)
    );
    return () => window.clearTimeout(timer);
  }, [checkTime, complete, isError, isLoading, isSuccess]);

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

      <motion.img
        className={styles.logo}
        src="/bh-logo-white.png"
        alt="Bahaa Films"
        initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
