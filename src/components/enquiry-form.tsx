"use client";

import { useRef, useState, type FormEvent } from "react";

/**
 * Local-only enquiry demonstration.
 *
 * The form has no `action`, no network call and no storage. Submission is
 * always intercepted, so no value ever leaves the browser tab. The audited
 * target instead disables its only submit control and posts to its own origin;
 * this recreates the measured pristine/focused/filled/invalid/valid states
 * while keeping the interaction inert.
 */

interface FieldErrors {
  readonly name?: string;
  readonly email?: string;
  readonly interest?: string;
  readonly stage?: string;
  readonly travellers?: string;
  readonly consent?: string;
}

type Outcome = "idle" | "invalid" | "checked";

const interests = [
  { value: "journey", label: "A journey" },
  { value: "camp", label: "A camp stay" },
  { value: "region", label: "A particular region" },
  { value: "operations", label: "How the season is run" },
];

const stages = [
  { value: "reading", label: "Just reading" },
  { value: "comparing", label: "Comparing options" },
  { value: "ready", label: "Ready to talk it through" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  const read = (key: string) => String(data.get(key) ?? "").trim();
  const errors: Record<string, string> = {};

  if (read("name") === "") {
    errors.name = "Enter the name we should use in reply.";
  }

  const email = read("email");
  if (email === "") {
    errors.email = "Enter an email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter an email address in the form name@example.com.";
  }

  if (read("interest") === "") {
    errors.interest = "Choose what you would like to read about.";
  }

  if (read("stage") === "") {
    errors.stage = "Choose how far along your planning is.";
  }

  const travellers = Number.parseInt(read("travellers"), 10);
  if (!Number.isFinite(travellers) || travellers < 1) {
    errors.travellers = "Enter how many people are travelling, as a whole number.";
  }

  if (data.get("consent") === null) {
    errors.consent = "Confirm you understand that nothing is sent.";
  }

  return errors;
}

export function EnquiryForm({ headingId }: { readonly headingId: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const summaryRef = useRef<HTMLDivElement>(null);

  const describedBy = (field: keyof FieldErrors, help?: string) =>
    [help, errors[field] ? `${field}-error` : null].filter(Boolean).join(" ") ||
    undefined;

  const invalid = (field: keyof FieldErrors) =>
    errors[field] ? ("true" as const) : undefined;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(event.currentTarget);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setOutcome("invalid");
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setOutcome("checked");
  };

  const onReset = () => {
    setErrors({});
    setOutcome("idle");
  };

  return (
    <div className="enquiry">
      <h2 className="band__title band__title--italic" id={headingId}>
        Plan out loud
      </h2>

      <p className="enquiry__notice">
        <strong>Local demonstration.</strong> This form checks itself in the browser and
        stops there. Nothing is transmitted, stored, emailed or measured, and no
        response is promised. A production destination and privacy notice are
        owner-supplied.
      </p>

      <form className="enquiry__form" noValidate onSubmit={onSubmit} onReset={onReset}>
        {outcome === "invalid" && Object.keys(errors).length > 0 ? (
          <div
            className="enquiry__status enquiry__status--error"
            role="alert"
            ref={summaryRef}
            tabIndex={-1}
          >
            <p className="enquiry__status-title">
              <span aria-hidden="true" className="enquiry__status-mark">
                !
              </span>
              There{" "}
              {Object.keys(errors).length === 1
                ? "is one answer"
                : `are ${Object.keys(errors).length} answers`}{" "}
              to check
            </p>
            <ul className="enquiry__summary">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`}>{message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {outcome === "checked" ? (
          <div className="enquiry__status enquiry__status--ok" role="status">
            <p className="enquiry__status-title">
              <span aria-hidden="true" className="enquiry__status-mark">
                ✓
              </span>
              Checked locally — nothing was sent
            </p>
            <p className="enquiry__summary">
              Every answer passed the local checks and stayed in this browser tab.
              Sending is disabled until the site owner supplies an approved destination,
              privacy notice and retention policy.
            </p>
          </div>
        ) : null}

        <fieldset>
          <legend>About you</legend>

          <div className="field">
            <label className="field__label" htmlFor="name">
              Name
            </label>
            <input
              className="field__control"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              aria-invalid={invalid("name")}
              aria-describedby={describedBy("name")}
            />
            {errors.name ? (
              <p className="field__error" id="name-error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <input
              className="field__control"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email", "email-help")}
            />
            <p className="field__help" id="email-help">
              Used only by the local check on this page.
            </p>
            {errors.email ? (
              <p className="field__error" id="email-error">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="place">
              Where you would travel from
            </label>
            <input
              className="field__control"
              id="place"
              name="place"
              type="text"
              autoComplete="country-name"
              aria-describedby="place-help"
            />
            <p className="field__help" id="place-help">
              Optional. It only changes which route south makes sense.
            </p>
          </div>
        </fieldset>

        <fieldset>
          <legend>About the journey</legend>

          <div className="field">
            <label className="field__label" htmlFor="interest">
              What would you like to read about
            </label>
            <select
              className="field__control"
              id="interest"
              name="interest"
              aria-invalid={invalid("interest")}
              aria-describedby={describedBy("interest")}
              defaultValue=""
            >
              <option value="">Choose one</option>
              {interests.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.interest ? (
              <p className="field__error" id="interest-error">
                {errors.interest}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="travellers">
              People travelling
            </label>
            <input
              className="field__control field__control--short numeric"
              id="travellers"
              name="travellers"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              aria-invalid={invalid("travellers")}
              aria-describedby={describedBy("travellers")}
            />
            {errors.travellers ? (
              <p className="field__error" id="travellers-error">
                {errors.travellers}
              </p>
            ) : null}
          </div>

          <fieldset
            className="field field--group"
            id="stage"
            aria-invalid={invalid("stage")}
            aria-describedby={describedBy("stage")}
          >
            <legend className="field__label">How far along is your planning</legend>
            <div className="enquiry__choices">
              {stages.map((option) => (
                <label className="choice" key={option.value}>
                  <input type="radio" name="stage" value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.stage ? (
              <p className="field__error" id="stage-error">
                {errors.stage}
              </p>
            ) : null}
          </fieldset>
        </fieldset>

        <fieldset>
          <legend>Anything else</legend>

          <div className="field">
            <label className="field__label" htmlFor="notes">
              Notes
            </label>
            <textarea
              className="field__control"
              id="notes"
              name="notes"
              rows={5}
              aria-describedby="notes-help"
            />
            <p className="field__help" id="notes-help">
              Optional. What you want to see, and anything that would make the days
              easier.
            </p>
          </div>

          <div className="field" id="consent">
            <label className="choice choice--wide">
              <input
                type="checkbox"
                name="consent"
                value="understood"
                aria-invalid={invalid("consent")}
                aria-describedby={describedBy("consent")}
              />
              <span>
                I understand this form is a local demonstration and that nothing is
                sent.
              </span>
            </label>
            {errors.consent ? (
              <p className="field__error" id="consent-error">
                {errors.consent}
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="enquiry__actions">
          <button className="button" type="submit">
            Check answers locally
          </button>
          <button className="button button--ghost" type="reset">
            Clear the form
          </button>
        </div>
      </form>
    </div>
  );
}
