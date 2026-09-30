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

import { phaseFromHash, phaseHash, phases, type PhaseId } from "@/content/adelva-owner";
import { useOwnerMotion } from "./owner-motion";
import styles from "./owner.module.css";

interface OwnerState {
  readonly root: RefObject<HTMLDivElement | null>;
  /** 1–6 for the chapters; the hero counts as 01 (the mock's index). */
  readonly chapter: number;
  /** The footer (or the end of the photograph) has reached the viewport. */
  readonly ended: boolean;
}

const OwnerContext = createContext<OwnerState | null>(null);

export function useOwner() {
  const state = useContext(OwnerContext);
  if (!state) throw new Error("useOwner outside OwnerExperience");
  return state;
}

const checkedPhase = (root: HTMLElement | null) =>
  (root?.querySelector<HTMLInputElement>('input[name="phase"]:checked')?.value ??
    null) as PhaseId | null;

/**
 * Marks what the chosen phase answers in 02 and 03 for assistive technology.
 * The visual emphasis is pure CSS (`:has(:checked)`), so the page works without this.
 */
function markCurrent(root: HTMLElement, id: PhaseId | null) {
  const phase = phases.find((p) => p.id === id);
  for (const node of root.querySelectorAll<HTMLElement>("[data-point]")) {
    if (phase && Number(node.dataset.point) === phase.point)
      node.setAttribute("aria-current", "true");
    else node.removeAttribute("aria-current");
  }
  for (const node of root.querySelectorAll<HTMLElement>(
    "tr[data-phase], li[data-phase]",
  )) {
    if (node.dataset.phase === id) node.setAttribute("aria-current", "true");
    else node.removeAttribute("aria-current");
  }
}

/**
 * Client root of /challenges/owner. The page is complete without it: the radio
 * buttons of 01 light the chosen bay, 02 and 03 through CSS. This adds the URL
 * hash, the chapter index's position and the scroll choreography.
 */
export function OwnerExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(1);
  const [ended, setEnded] = useState(false);
  const motion = useOwnerMotion(root);

  // A shared link (#phase-gm) or a restored form state chooses the phase on load.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const fromHash = phaseFromHash(location.hash);
    if (fromHash) {
      const input = node.querySelector<HTMLInputElement>(
        `input[name="phase"][value="${fromHash}"]`,
      );
      if (input) input.checked = true;
    }
    markCurrent(node, checkedPhase(node));
    const onHash = () => {
      const id = phaseFromHash(location.hash);
      if (!id) return;
      const input = node.querySelector<HTMLInputElement>(
        `input[name="phase"][value="${id}"]`,
      );
      if (input && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const onChange = useCallback((event: ChangeEvent<HTMLDivElement>) => {
    const target = event.target as unknown as HTMLInputElement;
    if (target.name !== "phase" || !root.current) return;
    const id = target.value as PhaseId;
    markCurrent(root.current, id);
    // Keep the choice shareable without moving the page.
    history.replaceState(history.state, "", phaseHash(id));
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const sections = [...node.querySelectorAll<HTMLElement>("section[data-chapter]")];
    const footer = node.querySelector<HTMLElement>("[data-home-footer]");
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = innerHeight * 0.4;
      let current = 1;
      for (const section of sections) {
        const index = Number(section.dataset.chapter);
        if (index >= 1 && index <= 6 && section.getBoundingClientRect().top <= line)
          current = index;
      }
      setChapter(current);
      setEnded((footer?.getBoundingClientRect().top ?? Infinity) < innerHeight * 0.92);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <OwnerContext.Provider value={{ root, chapter, ended }}>
      <div
        ref={root}
        className={styles.page}
        lang="ja"
        data-owner=""
        data-motion={motion ? "on" : undefined}
        onChange={onChange}
      >
        {children}
      </div>
    </OwnerContext.Provider>
  );
}
