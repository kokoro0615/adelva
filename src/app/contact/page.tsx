import type { Metadata } from "next";
import { connection } from "next/server";
import { preload } from "react-dom";

import { ContactPage } from "@/components/contact/contact-page";
import { challengeOptions } from "@/content/adelva-contact-options";
import { deliveryMode } from "@/lib/contact-delivery";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/contact");

export default async function ContactRoute() {
  // Whether a destination is configured is read per request, so a deployment
  // that gains CONTACT_WEBHOOK_URL never keeps serving the "not ready" notice.
  await connection();
  for (const [key, width, small, media, sizes] of [
    [
      "d",
      1536,
      1024,
      "(min-width: 720px)",
      "(min-width: 2160px) 2160px, (min-width: 1037px) 100vw, 1037px",
    ],
    ["m", 853, 600, "(max-width: 719.98px)", "100vw"],
  ] as const)
    preload(`/media/adelva/contact/${key}-plate-0-${width}.avif`, {
      as: "image",
      type: "image/avif",
      media,
      imageSrcSet: `/media/adelva/contact/${key}-plate-0-${small}.avif ${small}w, /media/adelva/contact/${key}-plate-0-${width}.avif ${width}w`,
      imageSizes: sizes,
      fetchPriority: "high",
    });
  return (
    <>
      <JsonLd data={pageGraph("/contact")} />
      <ContactPage
        options={challengeOptions}
        deliveryReady={deliveryMode() !== "unavailable"}
      />
    </>
  );
}
