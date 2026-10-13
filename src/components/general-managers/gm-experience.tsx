"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { issues, type IssueId } from "@/content/adelva-general-managers";
import { useGmMotion } from "./gm-motion";
import styles from "./general-managers.module.css";

interface GmState {
  readonly root: RefObject<HTMLDivElement | null>;
  /** Checked issues in page order. Mirrors the checkboxes, which stay the source of truth. */
  readonly selected: readonly IssueId[];
  /** 0 in the hero, then 1–7. The desktop index shows 01 as current in the hero (the mock). */
  readonly chapter: number;
  /** Below 1024 px: the viewport is between 01 and 04, where the tray belongs. */
  readonly trayZone: boolean;
}

const GmContext = createContext<GmState | null>(null);

export function useGm() {
  const state = useContext(GmContext);
  if (!state) throw new Error("useGm outside GmExperience");
  return state;
}

function readSelection(root: HTMLElement | null): IssueId[] {
  if (!root) return [];
  const checked = new Set(
    [...root.querySelectorAll<HTMLInputElement>('input[name="issue"]:checked')].map(
      (i) => i.value,
    ),
  );
  return issues.filter((issue) => checked.has(issue.id)).map((issue) => issue.id);
}

/**
 * Client root of /challenges/general-managers. The page is complete without it:
 * checkboxes light the terraces through CSS. This adds the chapter gauge's
 * position, the mobile selection tray and the scroll choreography.
 */
export function GmExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<readonly IssueId[]>([]);
  const [chapter, setChapter] = useState(0);
  const [compact, setCompact] = useState(false);
  const [trayZone, setTrayZone] = useState(false);
  const motion = useGmMotion(root);

  // Browsers restore form state on history navigation; start from the DOM.
  useEffect(() => {
    setSelected(readSelection(root.current));
  }, []);

  const onChange = useCallback((event: ChangeEvent<HTMLDivElement>) => {
    const target = event.target as unknown as HTMLInputElement;
    if (target.name === "issue") setSelected(readSelection(root.current));
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const sections = [...node.querySelectorAll<HTMLElement>("section[data-chapter]")];
    const decision = node.querySelector<HTMLElement>("section[data-point]");
    const points = [...node.querySelectorAll<HTMLElement>("[data-points] > li")];
    const glows = [...node.querySelectorAll<HTMLElement>("[data-cause-glow]")];
    // Document offsets, measured only when the layout changes: reading them on
    // every scroll frame forced a layout after each motion write.
    let tops: number[] = [];
    let pointTops: number[] = [];
    let stale = true;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = scrollY;
      if (stale) {
        stale = false;
        tops = sections.map((s) => s.getBoundingClientRect().top + y);
        pointTops = points.map((p) => p.getBoundingClientRect().top + y);
      }
      const line = y + innerHeight * 0.4;
      let current = 0;
      sections.forEach((section, i) => {
        const index = Number(section.dataset.chapter);
        if (index > 0 && tops[i] <= line) current = index;
      });
      setChapter(current);
      // 02: the marks follow the last point the reader has reached (spec §13.3).
      // Phones read the points below the marks, so their line sits lower.
      const reading = y + innerHeight * (innerWidth >= 1024 ? 0.55 : 0.72);
      let point = points[0];
      points.forEach((p, i) => {
        if (pointTops[i] <= reading) point = p;
      });
      if (decision && point && decision.dataset.point !== point.dataset.step) {
        decision.dataset.point = point.dataset.step;
        for (const p of points) p.toggleAttribute("data-active", p === point);
        for (const glow of glows) glow.dataset.point = point.dataset.step;
      }
      const first = (tops[1] ?? y) - y;
      const roles = (tops[4] ?? y) - y;
      setCompact(first < innerHeight * 0.6);
      setTrayZone(first < innerHeight && roles > innerHeight * 0.85);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const relayout = () => {
      stale = true;
      schedule();
    };
    const resized = new ResizeObserver(relayout);
    resized.observe(node);
    measure();
    void document.fonts?.ready.then(relayout);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", relayout);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      removeEventListener("scroll", schedule);
      removeEventListener("resize", relayout);
    };
  }, []);

  return (
    <GmContext.Provider value={{ root, selected, chapter, trayZone }}>
      <div
        ref={root}
        className={styles.page}
        lang="ja"
        data-general-managers=""
        data-gauge={compact ? "compact" : undefined}
        data-motion={motion ? "on" : undefined}
        onChange={onChange}
      >
        {children}
      </div>
    </GmContext.Provider>
  );
}
