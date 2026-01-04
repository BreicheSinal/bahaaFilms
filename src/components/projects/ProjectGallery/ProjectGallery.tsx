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
    const extension = cleanUrl.split(".").pop()?.toLowerCase();

    if (isIOS && (extension === "mp4" || extension === "m4v" || extension === "mov")) {
      return "video/mp4";
    }

    return getVideoType(url);
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

  const toggleVideoPlayback = (event: React.MouseEvent<HTMLVideoElement>) => {
    event.stopPropagation();
    const video = event.currentTarget;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
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
                  onClick={() => openLightbox(index)}
                >
                  <video
                    poster={item.thumbnail}
                    controls
                    playsInline
                    preload="metadata"
                    onClick={toggleVideoPlayback}
                  >
                    {renderVideoSources(item.url, item.sources)}
                  </video>
                  <div className={styles.overlay}>
                    <Maximize2 />
                  </div>
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
            onClick={closeLightbox}
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
                controls
                preload="metadata"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={toggleVideoPlayback}
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
