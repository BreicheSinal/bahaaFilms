import { Instagram, MessageCircle } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.copyright}>
          <span>&copy; {currentYear} Bahaa Breich. All rights reserved.</span>
          <span>
            Developed by{" "}
            <a
              href="https://invixlab.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.creditLink}
            >
              InvixLab
            </a>
          </span>
        </div>

        <div className={styles.social}>
          <a
            href="https://instagram.com/bahaafilms"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Instagram"
          >
            <Instagram />
          </a>
          <a
            href="https://wa.me/qr/R3A6NAXYXD5SG1"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="WhatsApp"
          >
            <MessageCircle />
          </a>
        </div>
      </div>
    </footer>
  );
}
