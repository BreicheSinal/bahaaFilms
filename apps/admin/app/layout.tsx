import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Bahaa Films Admin",
  description: "Admin dashboard for portfolio projects",
  icons: {
    icon: "/bh-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="admin-shell">
            <div className="admin-shell-content">{children}</div>
            <footer className="admin-attribution">
              Developed by{" "}
              <a
                href="https://invixlab.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                InvixLab
              </a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
