"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Project } from "@/data/projects";
import styles from "./ProjectGallery.module.css";

interface ProjectGalleryProps {
  media: Project["media"];
}

export default function ProjectGallery({ media }: ProjectGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod|Android|Mobi/i.test(navigator.userAgent);
  const showVideoControls = true;

  const getVideoType = (url?: string) => {
    if (!url) return undefined;
    const cleanUrl = url.split("?")[0];
    const extension = cleanUrl.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "mp4":
      case "m4v":
        return "video/mp4";
      case "mov":
        return "video/quicktime";
      case "webm":
        return "video/webm";
      default:
        return undefined;
    }
  };

  const getSourceType = (url?: string, providedType?: string) => {
    if (providedType) return providedType;
    if (!url) return undefined;
    const cleanUrl = url.split("?")[0];

    if (isIOS) {
      return "video/mp4";
    }

    return getVideoType(cleanUrl);
  };

  const renderVideoSources = (
    url?: string,
    sources?: Array<{ url: string; type?: string }>
  ) => {
    if (sources && sources.length) {
      return sources.map((source) => (
        <source
          key={`${source.url}-${source.type ?? "auto"}`}
          src={source.url}
          type={getSourceType(source.url, source.type)}
        />
      ));
    }

    
    if (!url) return null;
    return <source src={url} type={getSourceType(url)} />;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const handleLightboxClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % media.length);
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + media.length) % media.length);
    }
  };

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.grid}>
          {media.map((item, index) => (
            <motion.div
              key={index}
              className={`${styles.item} ${index === 0 ? styles.large : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {item.type === "image" ? (
                <div
                  className={styles.imageWrapper}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={item.url}
                    alt={`Gallery item ${index + 1}`}
                    className={styles.image}
                  />
                  <div className={styles.overlay}>
                    <Maximize2 />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.videoWrapper}
                  onClick={isMobile ? undefined : () => openLightbox(index)}
                >
                  <video
                    poster={item.thumbnail}
                    controls={showVideoControls}
                    playsInline
                    preload="metadata"
                  >
                    {renderVideoSources(item.url, item.sources)}
                  </video>
                  {!isMobile && (
                    <div className={styles.overlay}>
                      <Maximize2 />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleLightboxClick}
          >
            <button className={styles.close} onClick={closeLightbox}>
              <X />
            </button>

            {media.length > 1 && (
              <>
                <button
                  className={`${styles.nav} ${styles.prev}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  <ChevronLeft />
                </button>
                <button
                  className={`${styles.nav} ${styles.next}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight />
                </button>
              </>
            )}

            {media[lightboxIndex].type === "video" ? (
              <motion.video
                key={lightboxIndex}
                poster={media[lightboxIndex].thumbnail}
                autoPlay={!isIOS}
                muted={!isIOS}
                playsInline
                controls={showVideoControls}
                preload="metadata"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                {renderVideoSources(
                  media[lightboxIndex].url,
                  media[lightboxIndex].sources
                )}
              </motion.video>
            ) : (
              <motion.img
                key={lightboxIndex}
                src={media[lightboxIndex].url}
                alt={`Gallery item ${lightboxIndex + 1}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
