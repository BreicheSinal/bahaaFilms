"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Hero from '@/components/sections/Hero/Hero';
import Portfolio from '@/components/sections/Portfolio/Portfolio';
import Clients from '@/components/sections/Clients/Clients';
import Contact from '@/components/sections/Contact/Contact';
import CinematicIntro from "@/components/intro/CinematicIntro";

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [isScrollLocked, setIsScrollLocked] = useState(true);

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
    setIsScrollLocked(false);
  };

  return (
    <>
      <AnimatePresence onExitComplete={completeIntroExit}>
        {introVisible && <CinematicIntro onExit={beginIntroExit} />}
      </AnimatePresence>
      <Hero />
      <Clients />
      <Portfolio />
      <Contact />
    </>
  );
}
