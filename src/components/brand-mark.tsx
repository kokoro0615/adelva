import { brand } from "@/content/shared";

interface BrandMarkProps {
  /** `stacked` is the large footer lockup; `inline` is the fixed header lockup. */
  readonly variant?: "inline" | "stacked";
}

/** Authorized White Desert lockup, rendered from the locally-owned SVG masks. */
export function BrandMark({ variant = "inline" }: BrandMarkProps) {
  return (
    <span className={`brandmark${variant === "stacked" ? " brandmark--stacked" : ""}`}>
      <span className="brandmark__art" aria-hidden="true" />
      {/* These transparent text layers keep the exact visible SVG lockup and a
          useful accessible name in the same component. Only one participates
          at each responsive breakpoint. */}
      <span className="brandmark__word brandmark__word--full">{brand.wordmark}</span>
      <span className="brandmark__word brandmark__word--short">{brand.shortName}</span>
    </span>
  );
}
