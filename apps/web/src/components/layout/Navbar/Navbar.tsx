"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { id: "home", label: "Home", mode: "section" as const },
  { id: "portfolio", label: "Portfolio", mode: "route" as const, href: "/projects" },
  { id: "contact", label: "Contact", mode: "section" as const },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pendingSection = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    NAV_ITEMS.filter((item) => item.mode === "section").forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      if (pendingSection.current) {
        const target = pendingSection.current;
        const start = Date.now();
        const interval = setInterval(() => {
          const el = document.getElementById(target);
          if (el) {
            const offset = 72;
            const pos = el.offsetTop - offset;
            window.scrollTo({ top: pos, behavior: "smooth" });
            setActiveSection(target);
            pendingSection.current = null;
            clearInterval(interval);
          } else if (Date.now() - start > 2000) {
            pendingSection.current = null;
            clearInterval(interval);
          }
        }, 100);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const onHome = pathname === "/";

    const performScroll = () => {
      const target = document.getElementById(sectionId);
      if (target) {
        const offset = 72; // navbar height
        const elementPosition = target.offsetTop - offset;
        window.scrollTo({ top: elementPosition, behavior: "smooth" });
        setActiveSection(sectionId);
        setMobileMenuOpen(false);
        pendingSection.current = null;
        return true;
      }
      return false;
    };

    if (onHome) {
      performScroll();
    } else {
      pendingSection.current = sectionId;
      router.push("/");
    }

    if (pendingSection.current) {
      const start = Date.now();
      const interval = setInterval(() => {
        if (performScroll() || Date.now() - start > 2000) {
          clearInterval(interval);
          pendingSection.current = null;
        }
      }, 100);
    }
  };

  const handleNavItemClick = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.mode === "route" && item.href) {
      setMobileMenuOpen(false);
      router.push(item.href);
      return;
    }

    scrollToSection(item.id);
  };

  const isItemActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.mode === "route" && item.href) {
      return pathname.startsWith(item.href);
    }
    return pathname === "/" && activeSection === item.id;
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <a
          href="/"
          className={styles.logo}
          onClick={(event) => {
            event.preventDefault();
            router.push("/");
          }}
        >
          <img
            src={theme === "dark" ? "/bh-logo-white.png" : "/bh-logo.png"}
            alt="Bahaa Films"
            className={styles.logoImage}
          />
        </a>

        <nav className={styles.nav}>
          <ul className={styles.links}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavItemClick(item)}
                  className={`${styles.link} ${
                    isItemActive(item) ? styles.active : ""
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={styles.mobileMenuButton}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item)}
              className={`${styles.mobileLink} ${
                isItemActive(item) ? styles.active : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
