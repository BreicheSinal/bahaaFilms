'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Project } from '@/data/projects';
import styles from './ProjectGallery.module.css';

interface ProjectGalleryProps {
  media: Project['media'];
}

export default function ProjectGallery({ media }: ProjectGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.grid}>
          {media.map((item, index) => (
            <motion.div
              key={index}
              className={`${styles.item} ${index === 0 ? styles.large : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {item.type === 'image' ? (
                <div className={styles.imageWrapper} onClick={() => openLightbox(index)}>
                  <img src={item.url} alt={`Gallery item ${index + 1}`} className={styles.image} />
                  <div className={styles.overlay}>
                    <Maximize2 />
                  </div>
                </div>
              ) : (
                <div className={styles.videoWrapper} onClick={() => openLightbox(index)}>
                  <video
                    src={item.url}
                    poster={item.thumbnail}
                    controls
                    playsInline
                    preload="metadata"
                    onClick={(event) => event.stopPropagation()}
                  />
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

            {media[lightboxIndex].type === 'video' ? (
              <motion.video
                key={lightboxIndex}
                src={media[lightboxIndex].url}
                poster={media[lightboxIndex].thumbnail}
                autoPlay
                muted
                playsInline
                controls
                preload="metadata"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
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
