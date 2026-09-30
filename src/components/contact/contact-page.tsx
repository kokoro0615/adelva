import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { SiteHeader } from "@/components/site-header";
import { geometry, notes, type ChallengeOption } from "@/content/adelva-contact";
import { ContactExperience } from "./contact-experience";
import { ContactPhoto } from "./contact-photo";
import { SteppingStones } from "./stepping-stones";
import styles from "./contact.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function Notes() {
  return (
    <section className={styles.notes} aria-label={notes[0].title}>
      {notes.map((note) => (
        <div key={note.title} className={styles.note}>
          <h2>{note.title}</h2>
          <p>
            {note.body[0]}
            <br className={"link" in note ? styles.mobileBreak : undefined} />
            {note.body[1]}
          </p>
          {"link" in note && (
            <a className={styles.link} href={note.link.href}>
              {note.link.label}
              <span className={styles.la} aria-hidden="true" />
            </a>
          )}
        </div>
      ))}
    </section>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page} lang="ja" data-contact>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <HomeFooter />
    </div>
  );
}

/** /contact — the form over the continuous valley photograph. */
export function ContactPage({
  options,
  deliveryReady,
}: {
  options: readonly ChallengeOption[];
  deliveryReady: boolean;
}) {
  return (
    <Shell>
      <ContactExperience options={options} deliveryReady={deliveryReady}>
        <SteppingStones mode="form" />
        <Notes />
      </ContactExperience>
    </Shell>
  );
}

/** /contact/thanks — the same valley from the pool down to the inn. */
export function ContactThanksPage() {
  return (
    <Shell>
      <div
        className={styles.stage}
        data-stage
        data-thanks
        style={
          {
            "--from-d": geometry.desktop.thanksFrom,
            "--from-m": geometry.mobile.thanksFrom,
          } as Vars
        }
      >
        <ContactPhoto mode="thanks" />
        <div className={styles.thanksLead} />
        <SteppingStones mode="thanks" />
        <Notes />
        <div className={styles.veil} aria-hidden="true" />
      </div>
    </Shell>
  );
}
