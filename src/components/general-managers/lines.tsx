import { Fragment } from "react";

import styles from "./general-managers.module.css";

/**
 * Copy with layout-specific breaks: "\n" breaks everywhere, "<d>" only in the
 * desktop composition, "<m>" only in the mobile one (spec §5, content module).
 */
export function Lines({ text }: { text: string }) {
  return text.split(/(\n|<d>|<m>)/).map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (part === "<d>") return <br key={i} className={styles.dOnly} />;
    if (part === "<m>") return <br key={i} className={styles.mOnly} />;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * The same copy with every "\n" line in its own block, so the motion layer can
 * lift each line from behind its baseline (spec §13.3). Layout-specific breaks
 * stay inside their line.
 */
export function MaskLines({ text }: { text: string }) {
  return text.split("\n").map((line, i) => (
    <span key={i} className={styles.line}>
      <span className={styles.lineInner} data-line>
        <Lines text={line} />
      </span>
    </span>
  ));
}

/** The same copy as one plain string, for accessible names and tests. */
export const plain = (text: string) => text.replace(/\n|<d>|<m>/g, "");
