"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useGetProjectsQuery } from "@/store/projectsApi";
import { shouldRevealIntro } from "./introReadiness";
import { getIntroExitTransition } from "./introTransition";
import { getGreetingDelay } from "./greetingPacing";
import { getIntroSequencePhase } from "./introSequence";
import styles from "./CinematicIntro.module.css";

const GREETINGS = ["Bonjour", "Hola", "Ciao", "Hallo", "Marhaba", "こんにちは"];
const MIN_DURATION_MS = 4600;
const MAX_DURATION_MS = 7000;
const LOGO_HOLD_MS = 2000;

type CinematicIntroProps = {
  onExit: () => void;
};

export default function CinematicIntro({ onExit }: CinematicIntroProps) {
  const { isLoading, isSuccess, isError } = useGetProjectsQuery();
  const [greetingStep, setGreetingStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [sequencePhase, setSequencePhase] = useState<"greetings" | "burst">("greetings");
  const startTime = useRef(Date.now());
  const completed = useRef(false);
  const isBurst = greetingStep >= GREETINGS.length;
  const greetingTransitionDuration = isBurst ? 0.015 : 0.1;

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setShowLogo(true);
  }, []);

  useEffect(() => {
    const burstAtMs = MIN_DURATION_MS - 500;
    const timer = window.setTimeout(() => {
      if (getIntroSequencePhase(burstAtMs, MIN_DURATION_MS) === "burst") {
        setSequencePhase("burst");
      }
    }, burstAtMs);
    return () => window.clearTimeout(timer);
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
      () => setGreetingStep((current) => current + 1),
      greetingStep === 0 ? 420 : getGreetingDelay(greetingStep)
    );
    return () => window.clearTimeout(timer);
  }, [greetingStep, showLogo]);

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

      <AnimatePresence mode="sync" initial={false}>
        {!showLogo && sequencePhase === "greetings" ? (
          <motion.p
            key={greetingStep}
            className={styles.greeting}
            initial={{ opacity: greetingStep === 0 ? 1 : 0, y: greetingStep === 0 ? 0 : 18, filter: greetingStep === 0 ? "blur(0px)" : "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(5px)" }}
            transition={{ duration: greetingTransitionDuration, ease: "linear" }}
          >
            {GREETINGS[greetingStep % GREETINGS.length]}
          </motion.p>
        ) : !showLogo ? (
          <motion.div
            key="greeting-burst"
            className={styles.burst}
            initial={{ opacity: 0, scaleX: 0.55 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 1.35 }}
            transition={{ duration: 0.12, ease: "linear" }}
            aria-hidden="true"
          >
            {GREETINGS.concat(GREETINGS).map((greeting, index) => (
              <span key={`${greeting}-${index}`}>{greeting}</span>
            ))}
          </motion.div>
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
