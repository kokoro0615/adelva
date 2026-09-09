"use client";

import Image from "next/image";
import { useState } from "react";

import type { DetailImage } from "@/content/detail-target";

import styles from "./detail-clone.module.css";

interface DetailGalleryProps {
  readonly items: readonly DetailImage[];
  readonly label: string;
}

export function DetailGallery({ items, label }: DetailGalleryProps) {
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return null;
  }

  const previous = () =>
    setActive((current) => (current - 1 + items.length) % items.length);
  const next = () => setActive((current) => (current + 1) % items.length);

  return (
    <div className={styles.gallerySlider} aria-label={`${label} gallery`}>
      <div className={styles.galleryFrame} data-reveal-media>
        {items.map((item, index) => (
          <figure
            className={`${styles.galleryItem} gallery-slider_item`}
            data-active={index === active ? "true" : "false"}
            key={`${item.src}-${index}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="(max-width: 600px) calc(100vw - 32px), min(1120px, calc(100vw - 64px))"
              priority={index === 0}
            />
          </figure>
        ))}
        <span className={styles.galleryCounter} aria-live="polite">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(items.length).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.galleryControls}>
        <button type="button" onClick={previous} aria-label={`Previous ${label} image`}>
          Previous
        </button>
        <button type="button" onClick={next} aria-label={`Next ${label} image`}>
          Next
        </button>
      </div>
    </div>
  );
}
