"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { roleOptions } from "@/content/adelva-contact";
import { challengeOptions } from "@/content/adelva-contact-options";
import {
  CONTACT_SENT_COOKIE,
  deliver,
  markAccepted,
  wasAccepted,
} from "@/lib/contact-delivery";
import { validate, valuesFromFormData, type ContactState } from "@/lib/contact-form";

const ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Validates on the server with the client's rules, accepts each submission id
 * once, and delivers. With JavaScript the client plays the send motion and
 * navigates itself; without it this redirects to the thanks page.
 */
export async function submitContact(
  _previous: ContactState,
  data: FormData,
): Promise<ContactState> {
  const values = valuesFromFormData(data);
  const scripted = data.get("js") === "1";
  const idValue = data.get("submissionId");
  const id =
    typeof idValue === "string" && ID.test(idValue) ? idValue : crypto.randomUUID();

  // Honeypot: a filled hidden field is a bot. Answer as if sent, deliver nothing.
  const trap = data.get("website");
  if (typeof trap === "string" && trap.trim())
    return { status: "sent", at: Date.now() };

  const errors = validate(values, {
    challenge: challengeOptions.map((c) => c.id),
    role: roleOptions.map((r) => r.id),
  });
  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  if (!wasAccepted(id)) {
    const result = await deliver({
      id,
      receivedAt: new Date().toISOString(),
      challenges: values.challenge.map(
        (c) => challengeOptions.find((o) => o.id === c)?.label ?? c,
      ),
      role: roleOptions.find((r) => r.id === values.role)?.label ?? values.role,
      values,
    });
    if (result !== "delivered")
      return {
        status: result === "unavailable" ? "unavailable" : "failed",
        values,
        at: Date.now(),
      };
    markAccepted(id);
  }

  (await cookies()).set(CONTACT_SENT_COOKIE, "sent", {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL_ENV),
    maxAge: 600,
    path: "/contact",
  });
  if (!scripted) redirect("/contact/thanks");
  return { status: "sent", at: Date.now() };
}
