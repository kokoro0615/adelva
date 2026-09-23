"use client";
/* eslint-disable @next/next/no-img-element -- pre-optimized WebP with
   explicit srcset and reserved dimensions, as elsewhere on ADELVA pages. */

import { useCallback, useEffect, useRef, useState } from "react";

import { rooms } from "@/content/adelva-management-operations";

import styles from "./management-operations.module.css";

type RoomId = (typeof rooms.items)[number]["id"];

function Chevron({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={direction === "previous" ? "M10 2 4 8l6 6" : "m6 2 6 6-6 6"} />
    </svg>
  );
}

/**
 * 現場運営改善's rooms. Never autoplays: swipe (scroll-snap), the focusable
 * track's arrow keys, or the two buttons move it. The visible room lights the
 * rows it belongs to through `data-active-room` on the chapter, which the
 * server already renders as the lobby (06), the adopted initial state.
 */
export function RoomCarousel({ media }: { media: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const sync = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const slides = [...element.children] as HTMLElement[];
    const left = element.scrollLeft;
    let index = 0;
    const distance = (slide: HTMLElement) =>
      Math.abs(slide.offsetLeft - slides[0].offsetLeft - left);
    slides.forEach((slide, i) => {
      if (distance(slide) < distance(slides[index])) index = i;
    });
    // The last slide cannot scroll to its own start; the end of the track is it.
    if (left >= element.scrollWidth - element.clientWidth - 2)
      index = slides.length - 1;
    setActive(index);
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
  }, [sync]);

  useEffect(() => {
    const chapter = track.current?.closest<HTMLElement>("[data-chapter]");
    if (chapter) chapter.dataset.activeRoom = rooms.items[active].id satisfies RoomId;
  }, [active]);

  const go = (delta: number) => {
    const element = track.current;
    if (!element) return;
    const slides = [...element.children] as HTMLElement[];
    const next = Math.max(0, Math.min(slides.length - 1, active + delta));
    if (next === active) return;
    const target = slides[next];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({
      left: target.offsetLeft - slides[0].offsetLeft,
      behavior: reduce ? "instant" : "smooth",
    });
  };

  return (
    <div className={styles.carousel} data-carousel>
      <div
        ref={track}
        className={styles.track}
        tabIndex={0}
        role="group"
        aria-label={rooms.label}
      >
        {rooms.items.map((room, index) => (
          <div
            key={room.id}
            className={styles.slide}
            role="group"
            aria-label={room.name}
            data-room={room.id}
            data-active={index === active || undefined}
          >
            <img
              src={`${media}room-${room.id}-720.webp`}
              srcSet={`${media}room-${room.id}-720.webp 720w, ${media}room-${room.id}.webp 1280w`}
              sizes="(min-width: 600px) 420px, 273px"
              width={720}
              height={480}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className={styles.carouselControls}>
        <button
          type="button"
          className={styles.carouselButton}
          aria-label={rooms.previous}
          aria-disabled={active === 0}
          onClick={() => go(-1)}
        >
          <Chevron direction="previous" />
        </button>
        <ol className={styles.dots} aria-hidden="true">
          {rooms.items.map((room, index) => (
            <li key={room.id} data-active={index === active || undefined} />
          ))}
        </ol>
        <button
          type="button"
          className={styles.carouselButton}
          aria-label={rooms.next}
          aria-disabled={active === rooms.items.length - 1}
          onClick={() => go(1)}
        >
          <Chevron direction="next" />
        </button>
      </div>
    </div>
  );
}
