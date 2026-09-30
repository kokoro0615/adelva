import { afterEach, describe, expect, it, vi } from "vitest";

import { challengeOptions } from "@/content/adelva-contact-options";
import { domains, messages, roleOptions } from "@/content/adelva-contact";
import { challenges, serviceDomains } from "@/content/adelva-navigation";
import {
  deliver,
  deliveryMode,
  markAccepted,
  wasAccepted,
} from "@/lib/contact-delivery";
import {
  emptyValues,
  validate,
  valuesFromFormData,
  type ContactValues,
} from "@/lib/contact-form";

const valid: ContactValues = {
  challenge: ["operations-people"],
  role: "general-manager",
  message: "客室清掃の品質を見直したい。",
  company: "",
  name: "山田 花子",
  email: "hanako@example.jp",
  tel: "03-1234-5678",
  consent: true,
};
const allowed = {
  challenge: challengeOptions.map((c) => c.id),
  role: roleOptions.map((r) => r.id),
};

describe("contact options", () => {
  it("carries the approved challenges in order, then the undecided option", () => {
    expect(challengeOptions.map((c) => c.label)).toEqual([
      ...challenges.map((c) => c.label),
      "まだ整理できていない",
    ]);
    expect(challengeOptions.at(-1)?.domain).toBeUndefined();
  });
  it("maps each challenge to the domain the challenges page links it to", () => {
    expect(challengeOptions.slice(0, 5).map((c) => c.domain)).toEqual([0, 0, 0, 1, 2]);
    expect(domains.map((d) => d.label)).toEqual(serviceDomains.map((d) => d.label));
  });
});

describe("contact validation", () => {
  it("accepts a complete submission and treats the company as optional", () => {
    expect(validate(valid, allowed)).toEqual({});
  });
  it("reports every required field on an empty form", () => {
    expect(validate(emptyValues, allowed)).toEqual({
      challenge: messages.challenge,
      role: messages.role,
      message: messages.message,
      name: messages.name,
      email: messages.email,
      tel: messages.tel,
      consent: messages.consent,
    });
  });
  it("checks formats and rejects values the page never offered", () => {
    expect(validate({ ...valid, email: "hanako@example" }, allowed).email).toBe(
      messages.emailFormat,
    );
    expect(validate({ ...valid, tel: "12-34" }, allowed).tel).toBe(messages.telFormat);
    expect(
      validate({ ...valid, tel: "０３－１２３４－５６７８" }, allowed).tel,
    ).toBeUndefined();
    expect(validate({ ...valid, challenge: ["drop-table"] }, allowed).challenge).toBe(
      messages.challenge,
    );
    expect(validate({ ...valid, role: "admin" }, allowed).role).toBe(messages.role);
    expect(validate({ ...valid, message: "   " }, allowed).message).toBe(
      messages.message,
    );
  });
  it("reads FormData the way the browser posts it", () => {
    const data = new FormData();
    data.append("challenge", "operations-people");
    data.append("challenge", "revenue-brand");
    data.set("role", "owner");
    data.set("message", "x".repeat(5000));
    data.set("company", "c".repeat(300));
    data.set("consent", "on");
    const values = valuesFromFormData(data);
    expect(values.challenge).toEqual(["operations-people", "revenue-brand"]);
    expect(values.consent).toBe(true);
    expect(values.company).toHaveLength(200);
    expect(validate(values, allowed).message).toBe(messages.message);
  });
});

describe("contact delivery", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const submission = {
    id: "0f5f1d1e-2f9c-4c6e-9d57-0d7f6e9b1a2c",
    receivedAt: "2026-09-29T00:00:00.000Z",
    challenges: ["現場品質・人材を改善したい"],
    role: "総支配人・現場責任者",
    values: valid,
  };
  it("is unavailable until a destination is configured", async () => {
    vi.stubEnv("CONTACT_WEBHOOK_URL", "");
    vi.stubEnv("CONTACT_DELIVERY", "");
    expect(deliveryMode()).toBe("unavailable");
    expect(await deliver(submission)).toBe("unavailable");
  });
  it("never honours the accept mode in Vercel production", () => {
    vi.stubEnv("CONTACT_WEBHOOK_URL", "");
    vi.stubEnv("CONTACT_DELIVERY", "accept");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(deliveryMode()).toBe("unavailable");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(deliveryMode()).toBe("accept");
  });
  it("posts JSON to the webhook and reports failures as retryable", async () => {
    vi.stubEnv("CONTACT_WEBHOOK_URL", "https://hooks.example.test/contact");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await deliver(submission)).toBe("delivered");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.example.test/contact");
    expect(JSON.parse(init.body)).toMatchObject({
      type: "adelva.contact",
      id: submission.id,
      email: "hanako@example.jp",
      challenges: submission.challenges,
    });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect(await deliver(submission)).toBe("failed");
    fetchMock.mockRejectedValueOnce(new TypeError("network"));
    expect(await deliver(submission)).toBe("failed");
  });
  it("accepts a submission id once within ten minutes", () => {
    const now = Date.now();
    expect(wasAccepted("abc-12345", now)).toBe(false);
    markAccepted("abc-12345", now);
    expect(wasAccepted("abc-12345", now + 60_000)).toBe(true);
    expect(wasAccepted("abc-12345", now + 11 * 60_000)).toBe(false);
  });
});
