import { useSyncExternalStore } from "react";

/**
 * Page-driven overrides for the shared `SiteHeader`.
 *
 * Most routes give the header one surface for the whole page (see
 * `site-header.tsx`). HOME changes it while the reader moves through its
 * scenes — transparent over the film, paper over the letter, glass over the
 * photographs — and keeps the brand out of the bar until the giant ADELVA has
 * flown into it. The page writes here at scene boundaries only (the store
 * ignores repeated values), so the header re-renders a handful of times per
 * page, never per frame.
 */
export type HeaderSurface = "film" | "paper" | "glass";

export interface HeaderOverride {
  /** `null`: the route's own surface. `film`: no surface (over a photograph). */
  readonly surface: HeaderSurface | null;
  /** `hidden` keeps the brand out of the bar (only while motion is allowed). */
  readonly brand: "hidden" | "shown" | null;
  /** Fade the bar in with HOME's load intro (`null`: the route's default). */
  readonly intro: boolean | null;
}

const initial: HeaderOverride = { surface: null, brand: null, intro: null };
let state: HeaderOverride = initial;
const listeners = new Set<() => void>();

export function setHeaderOverride(next: Partial<HeaderOverride>): void {
  const merged = { ...state, ...next };
  if (
    merged.surface === state.surface &&
    merged.brand === state.brand &&
    merged.intro === state.intro
  ) {
    return;
  }
  state = merged;
  listeners.forEach((listener) => listener());
}

export function resetHeaderOverride(): void {
  setHeaderOverride(initial);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHeaderOverride(): HeaderOverride {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
