"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, FocusEvent, PointerEvent } from "react";

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "prefetch" | "href"> & {
  readonly href: string;
};

/**
 * `next/link` that prefetches on intent, never on visibility.
 *
 * A default `<Link>` prefetches its route as soon as it comes within 200px of
 * the viewport, and React applies the `preload()` hints in that route's
 * payload on arrival. Every page links somewhere near its top (breadcrumbs,
 * the header's brand, the closed drawer one width off screen), so every page
 * used to download HOME's film poster and other pages' plates and
 * stylesheets while its own first image was still loading — on a phone, over
 * a cellular link. This link warms its route when the pointer arrives, a
 * touch starts or focus lands, which is still well ahead of the click.
 *
 * A drop-in replacement: `import { IntentLink as Link } from "@/components/intent-link"`.
 */
export function IntentLink({ href, onPointerEnter, onFocus, ...props }: IntentLinkProps) {
  const router = useRouter();
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onPointerEnter={(event: PointerEvent<HTMLAnchorElement>) => {
        router.prefetch(href);
        onPointerEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        router.prefetch(href);
        onFocus?.(event);
      }}
    />
  );
}
