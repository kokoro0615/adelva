"use client";
import { useState, type CSSProperties } from "react";
import styles from "./revenue-brand.module.css";
export interface ChipItem {
  id: string;
  label: string;
  style?: CSSProperties;
  branch?: string;
}
export function ChipGroup({
  kind,
  label,
  initial,
  items,
  className,
}: {
  kind: "acquisition" | "photo";
  label: string;
  initial: string;
  items: readonly ChipItem[];
  className?: string;
}) {
  const [selected, setSelected] = useState<string | null>(initial);
  return (
    <div role="group" aria-label={label} className={className} data-chip-group={kind}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.chipButton} ${item.style ? styles.placedChip : ""}`}
          style={item.style}
          aria-pressed={selected === item.id}
          data-chip={item.id}
          data-branch={item.branch}
          onClick={(event) => {
            const next = selected === item.id ? null : item.id;
            setSelected(next);
            const root =
              event.currentTarget.closest<HTMLElement>("[data-revenue-brand]");
            if (root) {
              root.dataset[kind] = next ?? "";
              root.dispatchEvent(
                new CustomEvent("rb:select", { detail: { kind, id: next } }),
              );
            }
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") {
              const root =
                event.currentTarget.closest<HTMLElement>("[data-revenue-brand]");
              if (root) root.dataset.hoverChip = item.id;
            }
          }}
          onPointerLeave={(event) => {
            const root =
              event.currentTarget.closest<HTMLElement>("[data-revenue-brand]");
            if (root) delete root.dataset.hoverChip;
          }}
          onFocus={(event) => {
            const root =
              event.currentTarget.closest<HTMLElement>("[data-revenue-brand]");
            if (root) root.dataset.hoverChip = item.id;
          }}
          onBlur={(event) => {
            const root =
              event.currentTarget.closest<HTMLElement>("[data-revenue-brand]");
            if (root) delete root.dataset.hoverChip;
          }}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
