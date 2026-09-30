"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { issues, ui } from "@/content/adelva-general-managers";
import { prefersMotion } from "@/lib/motion";
import { useGm } from "./gm-experience";
import styles from "./general-managers.module.css";

/**
 * Below 1024 px the chosen issues would scroll out of sight; this tray keeps them
 * at the bottom of the screen from 01 to 03 and jumps to the related support.
 */
export function GmTray() {
  const { selected, trayZone, root } = useGm();
  const [message, setMessage] = useState("");
  const previous = useRef<number | null>(null);
  const open = selected.length > 0 && trayZone;

  // Announce changes made by the visitor, not the restored state on load.
  useEffect(() => {
    if (previous.current !== null && previous.current !== selected.length)
      setMessage(ui.trayCount(selected.length));
    previous.current = selected.length;
  }, [selected.length]);

  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    const rows = [
      ...(root.current?.querySelectorAll<HTMLElement>("[data-issues]") ?? []),
    ];
    const row = rows.find(
      (r) =>
        r.getAttribute("role") === "row" &&
        selected.some((id) => r.dataset.issues?.split(" ").includes(id)),
    );
    if (!row) return;
    event.preventDefault();
    row.scrollIntoView({
      behavior: prefersMotion() ? "smooth" : "auto",
      block: "center",
    });
    row.focus({ preventScroll: true });
    row.dataset.light = "run";
    window.setTimeout(() => delete row.dataset.light, 1400);
  };

  return (
    <>
      <div className={styles.tray} data-open={open} data-tray>
        <span className={styles.trayCount} aria-hidden="true">
          {selected.length}
        </span>
        <span className={styles.trayChips} aria-hidden="true">
          {issues
            .filter((issue) => selected.includes(issue.id))
            .map((issue) => (
              <span key={issue.id} className={`${styles.chip} ${styles.chipOn}`}>
                {issue.title}
              </span>
            ))}
        </span>
        <a className={styles.trayGo} href="#gm-03" onClick={go}>
          {ui.trayGo}
          <span aria-hidden="true">↓</span>
        </a>
      </div>
      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
