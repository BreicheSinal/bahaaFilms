"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Hero from '@/components/sections/Hero/Hero';
import Portfolio from '@/components/sections/Portfolio/Portfolio';
import Clients from '@/components/sections/Clients/Clients';
import Contact from '@/components/sections/Contact/Contact';
import CinematicIntro from "@/components/intro/CinematicIntro";

const INTRO_SESSION_KEY = "bahaa-films-intro-seen";

export default function Home() {
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    setIntroVisible(window.sessionStorage.getItem(INTRO_SESSION_KEY) !== "true");
  }, []);

  const completeIntro = () => {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    setIntroVisible(false);
  };

  return (
    <>
      <AnimatePresence>{introVisible && <CinematicIntro onComplete={completeIntro} />}</AnimatePresence>
      <Hero />
      <Clients />
      <Portfolio />
      <Contact />
    </>
  );
}
