import { Fragment } from "react";

import styles from "./owner.module.css";

/**
 * Copy with layout-specific breaks: "\n" breaks everywhere, "<d>" only in the
 * desktop composition, "<m>" only in the mobile one (content module header).
 */
export function Lines({ text }: { text: string }) {
  return text.split(/(\n|<d>|<m>)/).map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (part === "<d>") return <br key={i} className={styles.dOnly} />;
    if (part === "<m>") return <br key={i} className={styles.mOnly} />;
    return <Fragment key={i}>{part}</Fragment>;
  });
}
