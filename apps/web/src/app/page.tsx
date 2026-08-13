"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import Hero from '@/components/sections/Hero/Hero';
import Portfolio from '@/components/sections/Portfolio/Portfolio';
import Clients from '@/components/sections/Clients/Clients';
import Contact from '@/components/sections/Contact/Contact';
import CinematicIntro from "@/components/intro/CinematicIntro";
import { shouldShowIntro } from "@/components/intro/introPreview";

const INTRO_SESSION_KEY = "bahaa-films-intro-seen";

export default function Home() {
  const [introVisible, setIntroVisible] = useState<boolean | null>(null);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  useLayoutEffect(() => {
    const hasSeenIntro = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true";
    const showIntro = shouldShowIntro(window.location.search, hasSeenIntro);

    setIntroVisible(showIntro);
    if (showIntro) {
      setIsScrollLocked(true);
    }
  }, []);

  useEffect(() => {
    if (!isScrollLocked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isScrollLocked]);

  const beginIntroExit = () => {
    setIntroVisible(false);
  };

  const completeIntroExit = () => {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    setIsScrollLocked(false);
  };

  return (
    <>
      <AnimatePresence onExitComplete={completeIntroExit}>
        {introVisible === true && <CinematicIntro onExit={beginIntroExit} />}
      </AnimatePresence>
      <Hero />
      <Clients />
      <Portfolio />
      <Contact />
    </>
  );
}
