import { useEffect, useState } from "react";
import Navbar from "./components/layout/Navbar/Navbar";
import Footer from "./components/layout/Footer/Footer";
import Hero from "./components/sections/Hero/Hero";
import Portfolio from "./components/sections/Portfolio/Portfolio";
import Contact from "./components/sections/Contact/Contact";
import ProjectsPage from "./app/projects/page";
import ProjectPage from "./app/projects/[slug]/page";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getCurrentPath, listenToRouteChange } from "./utils/router";

export default function App() {
  const [path, setPath] = useState(getCurrentPath());

  useEffect(() => {
    const unsubscribe = listenToRouteChange(setPath);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [path]);

  const slugMatch = path.match(/^\/projects\/([^/]+)$/);
  const isProjectsList = path === "/projects";
  const isProjectDetail = Boolean(slugMatch);

  const renderRoute = () => {
    if (isProjectsList) return <ProjectsPage />;
    if (isProjectDetail) {
      const slug = slugMatch ? slugMatch[1] : "";
      return <ProjectPage params={{ slug }} />;
    }
    return (
      <>
        <Hero />
        <Portfolio />
        <Contact />
      </>
    );
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Navbar />
        <main>
          {renderRoute()}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
