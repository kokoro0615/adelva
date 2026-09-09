"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { WatchFilmButton } from "@/components/home/film-experience";
import { footerGroups } from "@/lib/navigation";

interface FooterItem {
  readonly href: string;
  readonly label: string;
}

const enquiryGroups = [
  {
    title: "Guests Enquiries",
    links: [
      { href: "mailto:travel@white-desert.com", label: "travel@white-desert.com" },
      { href: "tel:+27825728582", label: "+27 82 572 8582" },
      {
        href: "https://meetings-eu1.hubspot.com/meghan-sales/booktime",
        label: "Schedule a call",
      },
    ],
  },
  {
    title: "Trade Enquiries",
    links: [
      {
        href: "mailto:reservations@white-desert.com",
        label: "reservations@white-desert.com",
      },
      { href: "tel:+27648901472", label: "+27 64 890 1472" },
    ],
  },
  {
    title: "Other Enquiries",
    links: [
      { href: "mailto:press@white-desert.com", label: "press@white-desert.com" },
      {
        href: "mailto:careers@white-desert.com",
        label: "careers@white-desert.com",
      },
      { href: "mailto:info@white-desert.com", label: "info@white-desert.com" },
    ],
  },
] as const;

const socialLinks: readonly FooterItem[] = [
  {
    href: "https://www.instagram.com/white.desert.antarctica/",
    label: "Instagram",
  },
  { href: "https://www.linkedin.com/company/white-desert/", label: "LinkedIn" },
  { href: "https://www.facebook.com/white.desert.antarctica/", label: "Facebook" },
  {
    href: "https://www.youtube.com/channel/UCsQXhKIvmcHUkmnpVVjFBzA",
    label: "Youtube",
  },
];

const badges = [
  {
    src: "/media/target/footer/1-iaato.png",
    alt: "IAATO",
    href: "https://iaato.org/",
  },
  {
    src: "/media/target/footer/2-carbon-neutral.png",
    alt: "Carbon Neutral",
    href: "https://www.carbonneutral.com/",
  },
  {
    src: "/media/target/footer/3-global-vision-awards.png",
    alt: "Global Vision Awards",
    href: "https://www.travelandleisure.com/companies-global-vision-awards-2025-11688323",
  },
  {
    src: "/media/target/footer/4-conde-nast.png",
    alt: "Condé Nast",
    href: "https://www.cntraveler.com/hotels/antarctica/echo",
  },
  {
    src: "/media/target/footer/5-trip-adviser.png",
    alt: "TripAdvisor",
    href: "https://www.tripadvisor.com/Hotels-g12-Antarctica-Hotels.html",
  },
  {
    src: "/media/target/footer/6-20-years.png",
    alt: "20 Years",
  },
] as const;

const legalLinks: readonly FooterItem[] = [
  { href: "/legal/website-terms", label: "Website Terms of Use" },
  { href: "/legal/booking-terms", label: "Booking Terms" },
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookies Policy" },
];

function SmartLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  if (href.startsWith("/")) return <Link href={href}>{children}</Link>;
  const external = href.startsWith("https://");
  return (
    <a
      href={href}
      target={
        external || href.startsWith("mailto:") || href.startsWith("tel:")
          ? "_blank"
          : undefined
      }
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function FooterMenu({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly FooterItem[];
}) {
  return (
    <section className="colophon-menu">
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <SmartLink href={link.href}>{link.label}</SmartLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlusGlyph() {
  return <span className="colophon-plus" aria-hidden="true" />;
}

/** Exact target footer composition with local, authorized assets and links. */
export function SiteFooter() {
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const newsletterTitle = useId();
  const newsletterButton = useRef<HTMLButtonElement>(null);
  const itineraries = footerGroups.find((group) => group.id === "footer-journeys");
  const camps = footerGroups.find((group) => group.id === "footer-camps");
  const antarctica = footerGroups.find((group) => group.id === "footer-regions");
  const about = footerGroups.find((group) => group.id === "footer-about");

  if (!itineraries || !camps || !antarctica || !about) {
    throw new Error("The complete footer navigation authority is required.");
  }

  return (
    <footer
      className="colophon"
      data-site-footer
      data-fidelity-landmark="footer"
      aria-label="White Desert"
    >
      <div className="colophon__main">
        <div className="colophon__directory">
          <div className="colophon__directory-inner">
            <div className="colophon__symbol" aria-hidden="true" />

            <div className="colophon__menu-column">
              {enquiryGroups.map((group) => (
                <FooterMenu key={group.title} {...group} />
              ))}
            </div>

            <div className="colophon__menu-column">
              <FooterMenu title={itineraries.title} links={itineraries.links} />
              <FooterMenu title={camps.title} links={camps.links} />
            </div>

            <div className="colophon__menu-column">
              <FooterMenu title={antarctica.title} links={antarctica.links} />
              <FooterMenu title={about.title} links={about.links} />
              <FooterMenu title="Social" links={socialLinks} />
            </div>
          </div>
        </div>

        <div className="colophon__actions">
          <div className="colophon__actions-inner">
            <WatchFilmButton className="colophon-film">
              <Image
                src="/media/target/footer/watch-film.jpg"
                alt=""
                fill
                sizes="(max-width: 767px) 366px, 32vw"
                className="colophon-film__image"
              />
              <span className="colophon-film__shade" aria-hidden="true" />
              <span className="colophon-film__label">
                Watch Film <span className="colophon-play" aria-hidden="true" />
              </span>
            </WatchFilmButton>

            <div className="colophon__action-pair">
              <Link className="colophon__action" href="/prices">
                Dates &amp; Rates
              </Link>
              <Link
                className="colophon__action colophon__action--accent"
                href="/enquire"
              >
                Enquire now
              </Link>
            </div>

            <button
              ref={newsletterButton}
              className="colophon__action colophon__newsletter-trigger"
              type="button"
              aria-expanded={newsletterOpen}
              aria-controls="newsletter-panel"
              onClick={() => setNewsletterOpen((value) => !value)}
            >
              Newsletter Signup
            </button>

            <section
              id="newsletter-panel"
              className="newsletter-panel"
              aria-labelledby={newsletterTitle}
              data-open={newsletterOpen}
              inert={!newsletterOpen}
            >
              <div className="newsletter-panel__top">
                <h2 id={newsletterTitle}>Newsletter Signup</h2>
                <button
                  type="button"
                  aria-label="Close newsletter signup"
                  onClick={() => {
                    setNewsletterOpen(false);
                    window.requestAnimationFrame(() =>
                      newsletterButton.current?.focus(),
                    );
                  }}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <p>
                Be the first to know about new offerings and other updates from White
                Desert.
              </p>
              <form onSubmit={(event) => event.preventDefault()}>
                <label>
                  <span className="visually-hidden">Name and surname</span>
                  <input name="name" autoComplete="name" placeholder="Name & Surname" />
                </label>
                <label>
                  <span className="visually-hidden">Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                  />
                </label>
                <button type="submit" disabled>
                  Submit Form
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>

      <div className="colophon__bottom">
        <div className="colophon__wordmark">
          <BrandMark variant="stacked" />
        </div>

        <div className="colophon__info">
          <div className="colophon__badges">
            <PlusGlyph />
            {badges.map((badge) => {
              const image = (
                <Image src={badge.src} alt={badge.alt} width={42} height={42} />
              );
              return "href" in badge ? (
                <a key={badge.src} href={badge.href} target="_blank" rel="noreferrer">
                  {image}
                </a>
              ) : (
                <span key={badge.src}>{image}</span>
              );
            })}
          </div>

          <div className="colophon__quote">
            <p>“We all have our own white South”</p>
            <p>– Sir Ernest Shackleton</p>
          </div>

          <div className="colophon__legal">
            <div className="colophon__legal-links">
              {legalLinks.map((link) => (
                <SmartLink key={link.href} href={link.href}>
                  {link.label}
                </SmartLink>
              ))}
            </div>
            <div className="colophon__credit">
              <a href="https://www.malvah.co/" target="_blank" rel="noreferrer">
                Website by <span>Malvah</span>
              </a>
              <p>Whitedesert©2026. All rights reserved.</p>
            </div>
            <PlusGlyph />
          </div>
        </div>
      </div>
    </footer>
  );
}
