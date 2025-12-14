'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { getCurrentPath, navigateTo } from '@/utils/router';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const pendingSection = useRef<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0,
      }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (pendingSection.current) {
        const target = pendingSection.current;
        const start = Date.now();
        const interval = setInterval(() => {
          const el = document.getElementById(target);
          if (el) {
            const offset = 80;
            const pos = el.offsetTop - offset;
            window.scrollTo({ top: pos, behavior: 'smooth' });
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

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const onHome = getCurrentPath() === '/';

    const performScroll = () => {
      const target = document.getElementById(sectionId);
      if (target) {
        const offset = 80; // navbar height
        const elementPosition = target.offsetTop - offset;
        window.scrollTo({ top: elementPosition, behavior: 'smooth' });
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
      navigateTo('/');
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

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <a href="/" className={styles.logo}>
          Bahaa Breich
        </a>

        <nav className={styles.nav}>
          <ul className={styles.links}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`${styles.link} ${activeSection === item.id ? styles.active : ''}`}
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
              {theme === 'light' ? <Moon /> : <Sun />}
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
              onClick={() => scrollToSection(item.id)}
              className={`${styles.mobileLink} ${activeSection === item.id ? styles.active : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
