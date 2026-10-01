import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { preload } from "react-dom";

import { ContactThanksPage } from "@/components/contact/contact-page";
import { CONTACT_SENT_COOKIE } from "@/lib/contact-delivery";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/contact/thanks");

export default async function ContactThanksRoute() {
  // Only reachable right after an accepted submission (the action sets it).
  if ((await cookies()).get(CONTACT_SENT_COOKIE)?.value !== "sent")
    redirect("/contact");
  for (const [key, n, width, small, media] of [
    ["d", 5, 1536, 1024, "(min-width: 720px)"],
    ["m", 6, 853, 600, "(max-width: 719.98px)"],
  ] as const)
    preload(`/media/adelva/contact/${key}-plate-${n}-${width}.avif`, {
      as: "image",
      type: "image/avif",
      media,
      imageSrcSet: `/media/adelva/contact/${key}-plate-${n}-${small}.avif ${small}w, /media/adelva/contact/${key}-plate-${n}-${width}.avif ${width}w`,
      imageSizes:
        key === "d"
          ? "(min-width: 2160px) 2160px, (min-width: 1037px) 100vw, 1037px"
          : "100vw",
      fetchPriority: "high",
    });
  return <ContactThanksPage />;
}
