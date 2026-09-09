import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested page is not part of this field record.",
};

export default function NotFound() {
  return (
    <section
      className="band band--ice band--notfound"
      aria-labelledby="page-title"
      data-fidelity-landmark="hero"
    >
      <div className="shell">
        <p className="eyebrow">Not found</p>
        <h1 className="band__title" id="page-title">
          This page is not in the field record
        </h1>
        <p className="lede" data-fidelity-landmark="primary-content">
          The address you followed does not match any page on this site. The footer
          below lists every published route.
        </p>
        <p>
          <Link className="button" href="/">
            Back to the opening page
          </Link>
        </p>
      </div>
    </section>
  );
}
