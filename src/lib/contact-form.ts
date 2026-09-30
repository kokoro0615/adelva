/**
 * /contact form model shared by the client and the Server Action, so both
 * validate with the same rules (docs/specs/adelva-contact-spec.md §8.2).
 */
import { messages } from "@/content/adelva-contact";

export const CONTACT_FIELDS = [
  "challenge",
  "role",
  "message",
  "company",
  "name",
  "email",
  "tel",
  "consent",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export interface ContactValues {
  challenge: string[];
  role: string;
  message: string;
  company: string;
  name: string;
  email: string;
  tel: string;
  consent: boolean;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

export const emptyValues: ContactValues = {
  challenge: [],
  role: "",
  message: "",
  company: "",
  name: "",
  email: "",
  tel: "",
  consent: false,
};

export const LIMITS = {
  message: 4000,
  company: 200,
  name: 100,
  email: 254,
  tel: 40,
} as const;

/** One question per step on the progress rail. */
export const STEP_FIELDS: readonly (readonly ContactField[])[] = [
  ["challenge"],
  ["role"],
  ["message"],
  ["company", "name", "email", "tel", "consent"],
];

// Deliberately permissive: one @, no spaces, a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_CHARS = /^[0-9０-９+＋\-－ー()（）\s]+$/;

export function validateField(
  field: ContactField,
  values: ContactValues,
  allowed?: { challenge: readonly string[]; role: readonly string[] },
): string | undefined {
  switch (field) {
    case "challenge":
      if (!values.challenge.length) return messages.challenge;
      if (allowed && values.challenge.some((c) => !allowed.challenge.includes(c)))
        return messages.challenge;
      return;
    case "role":
      if (!values.role) return messages.role;
      if (allowed && !allowed.role.includes(values.role)) return messages.role;
      return;
    case "message":
      if (!values.message.trim() || values.message.length > LIMITS.message)
        return messages.message;
      return;
    case "company":
      // Optional; the input's maxLength and the server's truncation bound it.
      return;
    case "name":
      if (!values.name.trim() || values.name.length > LIMITS.name) return messages.name;
      return;
    case "email": {
      const email = values.email.trim();
      if (!email) return messages.email;
      if (email.length > LIMITS.email || !EMAIL.test(email))
        return messages.emailFormat;
      return;
    }
    case "tel": {
      const tel = values.tel.trim();
      if (!tel) return messages.tel;
      const digits = tel.replace(/[^0-9０-９]/g, "").length;
      if (tel.length > LIMITS.tel || !TEL_CHARS.test(tel) || digits < 10 || digits > 15)
        return messages.telFormat;
      return;
    }
    case "consent":
      return values.consent ? undefined : messages.consent;
  }
}

export function validate(
  values: ContactValues,
  allowed?: { challenge: readonly string[]; role: readonly string[] },
): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of CONTACT_FIELDS) {
    const message = validateField(field, values, allowed);
    if (message) errors[field] = message;
  }
  return errors;
}

export function valuesFromFormData(data: FormData): ContactValues {
  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    challenge: data
      .getAll("challenge")
      .filter((v): v is string => typeof v === "string")
      .slice(0, 12),
    role: text("role"),
    message: text("message").slice(0, LIMITS.message + 1),
    company: text("company").slice(0, LIMITS.company),
    name: text("name").slice(0, LIMITS.name + 1),
    email: text("email").slice(0, LIMITS.email + 1),
    tel: text("tel").slice(0, LIMITS.tel + 1),
    consent: data.get("consent") === "on",
  };
}

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: ContactErrors; values: ContactValues }
  | { status: "failed" | "unavailable"; values: ContactValues; at: number }
  | { status: "sent"; at: number };

export const initialState: ContactState = { status: "idle" };
