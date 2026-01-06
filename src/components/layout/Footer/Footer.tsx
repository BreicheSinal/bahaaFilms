import { Instagram, MessageCircle } from "lucide-react";
import packageJson from "../../../package.json";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appVersion = packageJson.version ?? "0.0.0";

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.copyright}>
          v{appVersion} | © {currentYear} Bahaa Breich. All rights reserved.
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
