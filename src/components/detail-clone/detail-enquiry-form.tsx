"use client";

import Image from "next/image";
import { useId, type CSSProperties } from "react";

import type { DetailHeight } from "@/content/detail-target";

import styles from "./detail-clone.module.css";

const months = [
  "November",
  "December",
  "January",
  "Not sure",
  "Day trip from Cape Town",
];
const interests = [
  "Baby Penguins",
  "South Pole",
  "Ice Tunnels",
  "Blue Rivers",
  "Science Week",
  "Not sure",
];

function Option({
  name,
  value,
  label,
  type = "radio",
}: {
  name: string;
  value: string;
  label: string;
  type?: "radio" | "checkbox";
}) {
  return (
    <label className={styles.optionLabel}>
      <input type={type} name={name} value={value} />
      <span>{label}</span>
    </label>
  );
}

export function DetailEnquiryForm({
  height,
  inventoryKey,
  inventoryCount = 0,
}: {
  readonly height: DetailHeight;
  readonly inventoryKey?: string;
  readonly inventoryCount?: number;
}) {
  const formId = useId();

  return (
    <section
      className={`${styles.section} ${styles.formSection} container-large`}
      style={
        {
          "--detail-height-desktop": `${height.desktop}px`,
          "--detail-height-tablet": `${height.tablet}px`,
          "--detail-height-mobile": `${height.mobile}px`,
        } as CSSProperties
      }
      data-detail-section="enquiry-form"
    >
      <div className={styles.formWrap}>
        <div className={styles.formIntro}>
          <p className={styles.kicker}>START PLANNING</p>
          <h2 className={styles.sectionHeading}>Tell us about your journey</h2>
          <p className={styles.narrativeBody}>
            Share a few details and our expedition team will be in touch. This local
            form is a planning aid; it does not send or store a request.
          </p>
        </div>

        <form
          className={styles.enquiryForm}
          id={formId}
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className={`${styles.fieldSet} enquiry-fieldset`}>
            <legend>When do you want to travel?</legend>
            <div className={`${styles.optionGrid} ${styles.seasonOptionGrid}`}>
              <div className={styles.seasonChoice}>
                <p>This Season</p>
                <Option
                  name="season"
                  value="nov-2026-feb-2027"
                  label="Nov 2026 - Feb 2027"
                />
              </div>
              <div className={styles.seasonChoice}>
                <p>Next Season</p>
                <Option
                  name="season"
                  value="nov-2027-feb-2028"
                  label="Nov 2027 - Feb 2028"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={`${styles.fieldSet} enquiry-fieldset`}>
            <legend>Travel Month?</legend>
            <div className={styles.optionGrid}>
              {months.map((month) => (
                <Option
                  key={month}
                  name="month"
                  value={month.toLowerCase().replaceAll(" ", "-")}
                  label={month}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className={`${styles.fieldSet} enquiry-fieldset`}>
            <legend>What are you interested in?</legend>
            <div className={styles.optionGrid}>
              {interests.map((interest) => (
                <Option
                  key={interest}
                  name="interest"
                  value={interest.toLowerCase().replaceAll(" ", "-")}
                  label={interest}
                  type="checkbox"
                />
              ))}
            </div>
          </fieldset>

          <fieldset className={`${styles.fieldSet} enquiry-fieldset`}>
            <legend>Contact Information</legend>
            <div className={styles.textGrid}>
              <label className={styles.fieldLabel}>
                First name
                <input name="firstName" autoComplete="given-name" />
              </label>
              <label className={styles.fieldLabel}>
                Last name
                <input name="lastName" autoComplete="family-name" />
              </label>
              <label className={styles.fieldLabel}>
                Email
                <input name="email" type="email" autoComplete="email" />
              </label>
              <label className={styles.fieldLabel}>
                Phone
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
              <label className={styles.fieldLabel}>
                Country
                <select name="country" defaultValue="">
                  <option value="" disabled>
                    Select country
                  </option>
                  <option value="us">United States</option>
                  <option value="gb">United Kingdom</option>
                  <option value="au">Australia</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className={`${styles.fieldLabel} ${styles.messageField}`}>
                Anything else?
                <textarea name="message" />
              </label>
            </div>
          </fieldset>

          <div className={styles.formFoot}>
            <p className={styles.formNote}>
              By continuing, you are preparing an enquiry for a conversation with our
              team.
            </p>
            <button type="submit" className={styles.formButton}>
              Continue planning
            </button>
          </div>
          {inventoryKey && inventoryCount > 0 ? (
            <span className={styles.imageInventory} aria-hidden="true">
              {Array.from({ length: inventoryCount }, (_, index) => (
                <Image
                  key={index}
                  className={styles.inventoryImage}
                  src={`${inventoryKey}-${(index % 4) + 2}.webp`}
                  alt=""
                  width={2000}
                  height={1333}
                />
              ))}
            </span>
          ) : null}
        </form>
      </div>
    </section>
  );
}
