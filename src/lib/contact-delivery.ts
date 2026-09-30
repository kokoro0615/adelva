/**
 * Where a /contact submission goes (docs/specs/adelva-contact-spec.md §8.4).
 *
 * The destination is an owner decision still open in information-architecture
 * §15, so it is configured rather than chosen here:
 *
 *  - `CONTACT_WEBHOOK_URL` — POST the submission as JSON to that endpoint.
 *  - `CONTACT_DELIVERY=accept` — accept without delivering or recording
 *    anything. Honoured outside Vercel production only; for e2e and previews.
 *
 * With neither, the form reports itself as unavailable instead of pretending
 * to have received anything. Server-only: never import from a client module.
 */
import type { ContactValues } from "@/lib/contact-form";

/** Set after an accepted submission; /contact/thanks requires it. */
export const CONTACT_SENT_COOKIE = "adelva_contact";

export type DeliveryMode = "webhook" | "accept" | "unavailable";

export function deliveryMode(): DeliveryMode {
  if (process.env.CONTACT_WEBHOOK_URL) return "webhook";
  if (
    process.env.CONTACT_DELIVERY === "accept" &&
    process.env.VERCEL_ENV !== "production"
  )
    return "accept";
  return "unavailable";
}

export interface Submission {
  readonly id: string;
  readonly receivedAt: string;
  readonly challenges: readonly string[];
  readonly role: string;
  readonly values: ContactValues;
}

export type DeliveryResult = "delivered" | "failed" | "unavailable";

const TIMEOUT_MS = 8000;

export async function deliver(submission: Submission): Promise<DeliveryResult> {
  const mode = deliveryMode();
  if (mode === "unavailable") return "unavailable";
  if (mode === "accept") return "delivered";
  const { values } = submission;
  try {
    const response = await fetch(process.env.CONTACT_WEBHOOK_URL as string, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "adelva.contact",
        id: submission.id,
        receivedAt: submission.receivedAt,
        challenges: submission.challenges,
        role: submission.role,
        message: values.message,
        company: values.company,
        name: values.name,
        email: values.email.trim(),
        tel: values.tel.trim(),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    return response.ok ? "delivered" : "failed";
  } catch {
    // Network error or timeout. The caller reports a retryable failure; the
    // submission content is never logged.
    return "failed";
  }
}

/**
 * Each submission id is accepted once. Instance-local and bounded, so a retry
 * after a double click or a replayed POST does not deliver twice; it is not a
 * cross-instance guarantee.
 */
const accepted = new Map<string, number>();
const REMEMBER_MS = 10 * 60 * 1000;

export function wasAccepted(id: string, now = Date.now()): boolean {
  for (const [key, at] of accepted) if (now - at > REMEMBER_MS) accepted.delete(key);
  return accepted.has(id);
}

export function markAccepted(id: string, now = Date.now()): void {
  if (accepted.size > 5000) accepted.clear();
  accepted.set(id, now);
}
