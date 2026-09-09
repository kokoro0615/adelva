/** Native identity layers keep text editable and the original motion wrappers. */
export function AdelvaWordmark({ outline = false }: { outline?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mg-vector${outline ? " mg-intro-outline" : ""}`}
    >
      <svg viewBox="0 0 726 198.77" fill={outline ? "none" : "currentColor"}>
        <text
          x="2"
          y="184"
          fontFamily="Oswald, sans-serif"
          fontWeight="500"
          fontSize="224"
          textLength="722"
          lengthAdjust="spacingAndGlyphs"
          stroke={outline ? "currentColor" : "none"}
          strokeWidth={outline ? "1.4" : undefined}
        >
          ADELVA
        </text>
      </svg>
    </span>
  );
}

export function AdelvaSymbol({ outline = false }: { outline?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mg-vector${outline ? " mg-intro-symbol-lines" : ""}`}
    >
      <svg viewBox="0 0 112 112" fill="none">
        {outline ? (
          <>
            <path
              d="M56 1 19 85h27L56 110 86 72 52 38h17L56 1Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M62 44c48-5 49 37 4 61L46 72h11l12 24 10-21-17-31Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </>
        ) : (
          <svg x="19" width="74" height="112" viewBox="338 237 348 528">
            <image href="/brand/adelva-logo.png" width="1024" height="1024" />
          </svg>
        )}
      </svg>
    </span>
  );
}

export const adelvaCircleCopy = "ADELVA — HOSPITALITY MANAGEMENT PARTNER —";

export function AdelvaCircleRing() {
  return (
    <span className="mg-vector mg-circle-ring" role="img" aria-label={adelvaCircleCopy}>
      <svg viewBox="0 0 620 620" overflow="visible" aria-hidden="true">
        <defs>
          <path
            id="adelva-about-ring"
            d="M310 -15a325 325 0 1 1 0 650a325 325 0 1 1 0-650"
          />
        </defs>
        <text
          fill="currentColor"
          fontFamily="MorghtMedium, sans-serif"
          fontSize="38"
          textLength="2008"
          lengthAdjust="spacing"
        >
          <textPath href="#adelva-about-ring">{`${adelvaCircleCopy} ${adelvaCircleCopy} `}</textPath>
        </text>
      </svg>
    </span>
  );
}
