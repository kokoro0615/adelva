"use client";

import type { CSSProperties } from "react";

import { chapters, ui } from "@/content/adelva-owner";
import { useOwner } from "./owner-experience";
import styles from "./owner.module.css";

/**
 * The chapter index fixed to the right edge: a slim line like the hook's bamboo
 * pole, whose orange crossbar slides to the current chapter (spec §8.3).
 */
export function OwnerIndex() {
  const { chapter, ended } = useOwner();
  return (
    <nav
      className={styles.index}
      aria-label={ui.indexLabel}
      data-index
      data-hidden={ended ? "" : undefined}
      style={{ "--idx": chapter - 1 } as CSSProperties}
    >
      <ol>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className={styles.indexLink}
              aria-current={chapter === i + 1 ? "location" : undefined}
            >
              <span aria-hidden="true">{c.number}</span>
              <span className={styles.visuallyHidden}>
                {c.number} {c.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <i className={styles.crossbar} aria-hidden="true" />
    </nav>
  );
}
