"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import { chapters, ui } from "@/content/adelva-general-managers";
import { useGm } from "./gm-experience";
import styles from "./general-managers.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Mobile staff: 372 px tall, eight equal steps, one tick per chapter. */
const STAFF = 372;
const STEP = STAFF / 8;

/**
 * The chapter index drawn as a water-level staff gauge: the level rises to the
 * current chapter. Desktop lists the chapters; below 1024 px the staff is one
 * button that opens the list in a sheet.
 */
export function GmGauge() {
  const { chapter } = useGm();
  const listed = Math.max(1, chapter);
  const staff = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  // Desktop default: link centres sit 42 px apart, the first 16 px below the staff top.
  const [level, setLevel] = useState({ lv: 16, ratio: 0.06 });
  const current = chapter ? chapters[chapter - 1] : null;

  useEffect(() => {
    const measure = () => {
      const staffBox = staff.current?.getBoundingClientRect();
      if (!staffBox || !staffBox.height) return;
      if (matchMedia("(min-width: 1024px)").matches) {
        const link = list.current?.children[listed - 1]?.firstElementChild;
        const box = link?.getBoundingClientRect();
        if (!box) return;
        const lv = box.top + box.height / 2 - staffBox.top;
        setLevel({ lv, ratio: lv / staffBox.height });
      } else {
        setLevel({ lv: STEP * chapter, ratio: (STEP * chapter) / STAFF });
      }
    };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [chapter, listed]);

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < box.left || x > box.right || y < box.top || y > box.bottom)
      sheet.current?.close();
  };

  return (
    <nav
      className={styles.gauge}
      aria-label={ui.gaugeLabel}
      style={{ "--lv": `${level.lv}px`, "--lv-ratio": level.ratio } as Vars}
      data-gauge
    >
      <span ref={staff} className={styles.gaugeStaff} aria-hidden="true">
        {chapters.map((c, i) => (
          <i
            key={c.id}
            className={styles.gaugeTick}
            style={{ top: Math.round(STEP * (i + 1)) }}
          />
        ))}
        <i className={styles.gaugeLevel} />
        <i className={styles.gaugeMark} />
      </span>
      <ol ref={list} className={styles.gaugeList}>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a
              className={styles.gaugeLink}
              href={`#${c.id}`}
              aria-current={i + 1 === listed ? "location" : undefined}
            >
              {c.label}
              <b>{c.number}</b>
            </a>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={styles.gaugeButton}
        aria-haspopup="dialog"
        aria-label={ui.gaugeOpen(current?.label)}
        onClick={() => sheet.current?.showModal()}
      >
        {current && (
          <span className={styles.gaugeNow} aria-hidden="true">
            <b>{current.number}</b>
            {current.label}
          </span>
        )}
      </button>
      <dialog
        ref={sheet}
        className={styles.sheet}
        aria-labelledby="gm-sheet-title"
        onClick={closeOnBackdrop}
      >
        <div className={styles.sheetHead}>
          <p id="gm-sheet-title">{ui.gaugeLabel}</p>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={() => sheet.current?.close()}
          >
            {ui.close}
          </button>
        </div>
        <ol className={styles.sheetList}>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={i + 1 === chapter ? "location" : undefined}
                onClick={() => sheet.current?.close()}
              >
                <b>{c.number}</b>
                {c.label}
              </a>
            </li>
          ))}
        </ol>
      </dialog>
    </nav>
  );
}
