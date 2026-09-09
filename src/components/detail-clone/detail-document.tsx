import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { MotionStage } from "@/components/motion-stage";
import type {
  DetailCard,
  DetailImage,
  DetailPage,
  DetailSection,
} from "@/content/detail-target";

import { DetailEnquiryForm } from "./detail-enquiry-form";
import { DetailGallery } from "./detail-gallery";
import styles from "./detail-clone.module.css";

type HeightVars = CSSProperties & {
  "--detail-height-desktop": string;
  "--detail-height-tablet": string;
  "--detail-height-mobile": string;
};

const heightStyle = (height: DetailSection["height"]): HeightVars => ({
  "--detail-height-desktop": `${height.desktop}px`,
  "--detail-height-tablet": `${height.tablet}px`,
  "--detail-height-mobile": `${height.mobile}px`,
});

const toneClass = (tone: "light" | "dark" | "blue" | undefined) => {
  if (tone === "dark") return styles.dark;
  if (tone === "blue") return styles.blue;
  return styles.light;
};

function DetailImageView({
  item,
  priority = false,
  className,
}: {
  item: DetailImage;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      className={className}
      src={item.src}
      alt={item.alt}
      width={item.width}
      height={item.height}
      sizes="(max-width: 600px) 100vw, (max-width: 1100px) 90vw, 1120px"
      priority={priority}
    />
  );
}

function MediaInventory({ pageKey, count }: { pageKey: string; count: number }) {
  if (count <= 0) return null;
  return (
    <div className={styles.imageInventory} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <DetailImageView
          key={index}
          className={styles.inventoryImage}
          item={{
            src: `${pageKey}-${(index % 4) + 2}.webp`,
            alt: "",
            width: 2000,
            height: 1333,
          }}
        />
      ))}
    </div>
  );
}

function DetailNav({ page }: { page: DetailPage }) {
  if (!page.nav) return null;
  const itinerary = page.family === "journey";
  return (
    <nav
      className={`${styles.detailNav} ${itinerary ? "cta-nav_wrap" : "about-nav_wrap"}`}
      aria-label={`${page.title} navigation`}
    >
      <ul className={styles.detailNavList}>
        {page.nav.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              aria-current={item.href === page.path ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DetailHero({ page }: { page: DetailPage }) {
  const small = page.family === "prices";
  const plainClass = small
    ? "fixed-banner_wrap-small"
    : page.family === "operations" ||
        page.family === "region" ||
        page.family.startsWith("about")
      ? "about-banner-loader"
      : "fixed-banner-loader";
  const height = small
    ? { desktop: 585, tablet: 666, mobile: 549 }
    : { desktop: 900, tablet: 1024, mobile: 844 };
  const heroCopy = (() => {
    if (page.family.startsWith("about")) {
      return {
        kicker: "About",
        title:
          page.family === "about-founders"
            ? "Our Story"
            : page.family === "about-foundation"
              ? "Foundation"
              : "Sustainability",
        showLede: false,
      };
    }
    if (page.family === "operations") {
      return { kicker: "Logistics", title: "Behind the Scenes", showLede: false };
    }
    if (page.family === "aviation") {
      return {
        kicker: "Flights to Antarctica",
        title: "Aviation",
        showLede: false,
      };
    }
    if (page.family === "region") {
      return { kicker: "Regions", title: page.title, showLede: false };
    }
    return { kicker: undefined, title: page.title, showLede: true };
  })();
  return (
    <section
      className={`${styles.banner} ${plainClass}`}
      style={heightStyle(height)}
      data-hero
      data-detail-family={page.family}
      data-detail-section="hero"
    >
      <div className={styles.bannerImage} data-hero-media data-parallax>
        <DetailImageView item={page.hero} priority />
      </div>
      <div className={styles.bannerScrim} data-hero-scrim />
      <div className={styles.bannerContent} data-hero-body>
        {heroCopy.kicker ? (
          <p className={styles.heroKicker}>{heroCopy.kicker}</p>
        ) : null}
        <h1 className={styles.bannerTitle} data-fidelity-landmark="hero-title">
          {heroCopy.title}
        </h1>
        {heroCopy.showLede ? <p className={styles.bannerLede}>{page.lede}</p> : null}
        {page.date || page.price || page.coordinates ? (
          <p className={styles.bannerMeta}>
            {page.family === "journey" && page.price ? <span>{page.price}</span> : null}
            {page.date ? <span>{page.date}</span> : null}
            {page.family !== "journey" && page.price ? <span>{page.price}</span> : null}
            {page.coordinates ? <span>{page.coordinates}</span> : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SplitRail({
  section,
  images,
}: {
  section: { splitCount?: number };
  images: DetailImage[];
}) {
  if (!section.splitCount || images.length === 0) return null;
  return (
    <div className={styles.splitRail} data-reveal-group>
      {Array.from({ length: section.splitCount }, (_, index) => {
        const item = images[index % images.length];
        return (
          <div
            className={`${styles.splitRailItem} split-slider_item`}
            data-reveal-media
            key={`${item.src}-${index}`}
          >
            <DetailImageView
              item={{ ...item, alt: `${item.alt}, view ${index + 1}` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Card({
  card,
  kind = "simple",
  extraClass,
}: {
  card: DetailCard;
  kind?: "simple" | "flick" | "team";
  extraClass?: string;
}) {
  const content = (
    <>
      {card.image ? (
        <span className={styles.cardImage}>
          <DetailImageView item={card.image} />
        </span>
      ) : null}
      <span className={styles.cardContent}>
        {card.eyebrow ? (
          <span className={styles.cardEyebrow}>{card.eyebrow}</span>
        ) : null}
        <h3>{card.title}</h3>
        <p>{card.body}</p>
      </span>
    </>
  );
  const cardClass =
    kind === "flick"
      ? `${styles.flickCard} card-flick_item`
      : kind === "team"
        ? `${styles.teamMember} team-member`
        : card.className === "region-card"
          ? `${styles.simpleCard} region-card`
          : `${styles.simpleCard} card-simple`;
  const className = `${cardClass} ${extraClass ?? card.className ?? ""}`.trim();
  return card.href ? (
    <Link className={className} href={card.href}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

function RenderNarrative({
  section,
  nested = false,
  inventoryKey,
  inventoryCount = 0,
}: {
  section: Extract<DetailSection, { kind: "narrative" }>;
  nested?: boolean;
  inventoryKey?: string;
  inventoryCount?: number;
}) {
  if (section.id === "region-sticky") {
    return <RenderRegionSticky section={section} />;
  }

  const images = [section.image, ...(section.images ?? [])].filter(
    (item): item is DetailImage => Boolean(item),
  );
  const structuralClass = section.id === "glass-banner" ? "glass-center-banner" : "";
  return (
    <section
      className={`${styles.section} ${toneClass(section.tone)} ${nested ? styles.nested : ""} editorial-wrap ${structuralClass}`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
      data-detail-nested={nested ? "true" : undefined}
    >
      <div className={styles.contentWrap} data-reveal-group>
        <div className={styles.narrativeGrid}>
          <div className={styles.narrativeCopy} data-reveal>
            {section.kicker ? <p className={styles.kicker}>{section.kicker}</p> : null}
            <h2 className={styles.sectionHeading}>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p className={styles.narrativeBody} data-reveal key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
          {section.image ? (
            <div className={styles.mediaPanel} data-reveal-media>
              <DetailImageView item={section.image} />
            </div>
          ) : null}
        </div>
        <SplitRail section={section} images={images} />
        {section.nested?.map((child) => (
          <RenderSection key={child.id} section={child} nested />
        ))}
        {inventoryKey ? (
          <MediaInventory pageKey={inventoryKey} count={inventoryCount} />
        ) : null}
      </div>
    </section>
  );
}

function RenderRegionSticky({
  section,
}: {
  section: Extract<DetailSection, { kind: "narrative" }>;
}) {
  return (
    <div
      className={`${styles.section} ${toneClass(section.tone)} sticky-split_slider ${styles.regionSticky}`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.regionStickyInner}>
        {section.image ? (
          <div className={styles.regionStickyMedia}>
            <DetailImageView item={section.image} />
          </div>
        ) : null}
        <div className={styles.regionStickyCopy}>
          {section.paragraphs.map((paragraph) => (
            <p className={styles.regionStickyBody} key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function RenderTeam({
  section,
}: {
  section: Extract<DetailSection, { kind: "team" }>;
}) {
  return (
    <section
      className={`${styles.section} ${styles.team} team-members-section`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.contentWrap}>
        <p className={styles.kicker}>THE WHITE DESERT TEAM</p>
        <h2 className={styles.sectionHeading}>{section.heading}</h2>
        <p className={styles.narrativeBody}>{section.intro}</p>
        <div className={styles.teamGrid} data-reveal-group>
          {section.members.map((member) => (
            <Card card={member} kind="team" key={member.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderScrub({
  section,
}: {
  section: Extract<DetailSection, { kind: "scrub" }>;
}) {
  return (
    <section
      className={`${styles.section} ${styles.scrub} about-scrub_component`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div>
        <p className={styles.scrubLabel}>{section.label}</p>
        <p className={styles.scrubBody}>{section.body}</p>
      </div>
    </section>
  );
}

function RenderQuote({
  section,
  nested = false,
}: {
  section: Extract<DetailSection, { kind: "quote" }>;
  nested?: boolean;
}) {
  return (
    <section
      className={`${styles.section} ${styles.quote} ${toneClass(section.tone)} ${nested ? styles.nested : ""}`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div>
        <p className={styles.quoteText}>“{section.quote}”</p>
        <p className={styles.quoteAttribution}>{section.attribution}</p>
      </div>
    </section>
  );
}

function RenderGallery({
  section,
  nested = false,
}: {
  section: Extract<DetailSection, { kind: "gallery" }>;
  nested?: boolean;
}) {
  return (
    <section
      className={`${styles.section} ${styles.gallery} ${toneClass(section.tone)} ${nested ? styles.nested : ""} gallery-slider`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <h2 className={styles.galleryHeading}>{section.heading}</h2>
      <DetailGallery items={section.items} label={section.heading} />
    </section>
  );
}

function RenderCards({
  section,
}: {
  section: Extract<DetailSection, { kind: "cards" }>;
}) {
  return (
    <section
      className={`${styles.section} ${styles.cards} ${toneClass(section.tone)} cards-simple-section`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.contentWrap}>
        <h2 className={styles.sectionHeading}>{section.heading}</h2>
        <div className={styles.cardGrid} data-reveal-group>
          {section.cards.map((card, index) => (
            <Card
              card={card}
              kind={section.cardClass ?? "simple"}
              key={`${card.title}-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderAccordion({
  section,
  nested = false,
}: {
  section: Extract<DetailSection, { kind: "accordion" }>;
  nested?: boolean;
}) {
  return (
    <section
      className={`${styles.section} ${styles.accordion} ${toneClass(section.tone)} ${nested ? styles.nested : ""} ${section.id === "amenities" ? "camp-amenities_component" : ""}`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.accordionGrid}>
        <div className={styles.accordionIntro}>
          {section.kicker ? <p className={styles.kicker}>{section.kicker}</p> : null}
          <h2 className={styles.sectionHeading}>{section.heading}</h2>
          <p className={styles.narrativeBody}>{section.intro}</p>
        </div>
        <div className={styles.accordionList} data-reveal-group>
          {section.items.map((item, index) => (
            <details
              className={`${styles.accordionItem} accordion-item`}
              key={`${item}-${index}`}
            >
              <summary>{item}</summary>
              <p>{`Our team approaches ${item.toLowerCase()} with care, evidence and the realities of the Antarctic environment in mind.`}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderHighlights({
  section,
}: {
  section: Extract<DetailSection, { kind: "highlights" }>;
}) {
  return (
    <section
      className={`${styles.section} ${styles.highlights} padding-none bg-dark`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.highlightIntro}>
        <p className={styles.kicker}>LIFE ON THE ICE</p>
        <h2 className={styles.sectionHeading}>{section.heading}</h2>
        <p className={styles.narrativeBody}>{section.intro}</p>
      </div>
      <div className={styles.highlightCategories} data-reveal-group>
        {section.categories.map((category) => (
          <article className={styles.highlightCategory} key={category.title}>
            <h3>{category.title}</h3>
            <ul>
              {category.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className={styles.tripRail} data-reveal-group>
        {section.cards.map((card, index) => (
          <Card card={card} kind="flick" key={`${card.title}-${index}`} />
        ))}
      </div>
      <div className={styles.campMoreCards} data-reveal-group>
        {section.cards.slice(0, 4).map((card, index) => (
          <Card card={card} key={`camp-more-${card.title}-${index}`} />
        ))}
      </div>
      <div className={`${styles.videoRail} video-popup`} aria-hidden="true">
        <video controls preload="none" src="/media/video/white-desert-film-web.mp4" />
      </div>
    </section>
  );
}

function RenderItinerary({
  section,
}: {
  section: Extract<DetailSection, { kind: "itinerary" }>;
}) {
  const inventory = section.image ? [section.image] : [];
  return (
    <section
      className={`${styles.section} ${styles.itinerary} deep-blue-section`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.itineraryHeader}>
        <p className={styles.kicker}>SAMPLE ITINERARY</p>
        <h2 className={styles.sectionHeading}>{section.heading}</h2>
        <h3 className={styles.itineraryTitle}>{section.title}</h3>
        <p className={styles.itineraryLead}>{section.intro}</p>
      </div>
      <div className={styles.dayList} data-reveal-group>
        {section.days.map((day) => (
          <article className={styles.dayCard} key={day.day}>
            <strong>{day.day}</strong>
            <h3>{day.title}</h3>
            <p>{day.body}</p>
          </article>
        ))}
      </div>
      {section.cards ? (
        <div className={styles.tripRail} data-reveal-group>
          {section.cards.map((card, index) => (
            <Card
              card={card}
              kind="flick"
              extraClass="large-card"
              key={`${card.title}-${index}`}
            />
          ))}
        </div>
      ) : null}
      {section.image ? (
        <div className={styles.itineraryImage} data-reveal-media>
          <DetailImageView item={section.image} />
        </div>
      ) : null}
      {section.splitCount ? <SplitRail section={section} images={inventory} /> : null}
      {section.videoCount ? (
        <div className={`${styles.videoRail} video-popup`} aria-hidden="true">
          {Array.from({ length: section.videoCount }, (_, index) => (
            <video
              key={index}
              controls
              preload="none"
              src="/media/video/white-desert-film-web.mp4"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RenderOperations({
  section,
}: {
  section: Extract<DetailSection, { kind: "operations" }>;
}) {
  const operationsImage = (index: number) => imageForOperations(index);
  return (
    <section
      className={`${styles.section} ${styles.operations} expertise-page_content`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.contentWrap}>
        <p className={styles.kicker}>BEHIND THE SCENES</p>
        <h2 className={styles.sectionHeading}>{section.heading}</h2>
        <p className={styles.narrativeBody}>{section.intro}</p>
        <div className={styles.operationsGroups}>
          {section.groups.map((group, groupIndex) => (
            <article className={styles.operationGroup} key={group.title}>
              <div>
                <p className={styles.kicker}>{group.title}</p>
                <p className={styles.narrativeBody}>{group.body}</p>
              </div>
              {group.people ? (
                <ul className={styles.peopleList}>
                  {group.people.map((person) => (
                    <li key={person}>{person}</li>
                  ))}
                </ul>
              ) : null}
              {groupIndex < section.groups.length - 1 ? (
                <div className={styles.operationImage} data-reveal-media>
                  <DetailImageView item={operationsImage(groupIndex + 2)} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <div className={styles.operationInventory} aria-hidden="true">
          {Array.from({ length: section.imageCount }, (_, index) => (
            <DetailImageView key={index} item={operationsImage(index + 2)} />
          ))}
        </div>
        <div className={styles.operationsCta}>
          <Link className={styles.ctaLink} href="/enquire">
            Start planning
          </Link>
        </div>
      </div>
    </section>
  );
}

function imageForOperations(index: number): DetailImage {
  const safe = ((index - 1) % 4) + 2;
  return {
    src: `/media/target/detail/antarctica-behind-the-scenes-${safe}.webp`,
    alt: "White Desert Antarctic operations",
    width: 2000,
    height: 1333,
  };
}

function RenderRates({
  section,
}: {
  section: Extract<DetailSection, { kind: "rates" }>;
}) {
  return (
    <section
      className={`${styles.section} ${styles.rates} rates-body`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div className={styles.ratesHeader}>
        <h2 className={styles.visuallyHidden}>{section.heading}</h2>
        <p className={styles.seasonPrompt}>Select your season:</p>
        <div className={styles.seasonTabs} aria-label="Season">
          <span className={`${styles.seasonTab} ${styles.seasonTabActive}`}>
            2026 – 2027
          </span>
          <span className={styles.seasonTab}>2027 – 2028</span>
        </div>
      </div>
      <div className={styles.rateGrid} data-reveal-group>
        {section.cards.map((card, index) => (
          <article
            className={`${styles.rateCard} split-slider_item`}
            key={`${card.title}-${index}`}
          >
            {card.image ? (
              <div className={styles.rateImage}>
                <DetailImageView item={card.image} />
              </div>
            ) : null}
            <div className={styles.rateCopy}>
              {card.eyebrow ? (
                <p className={styles.rateEyebrow}>{card.eyebrow}</p>
              ) : null}
              <h3>{card.title}</h3>
            </div>
            <p className={styles.rateBody}>{card.body}</p>
            {card.href && [0, 2, 4, 5, 6, 7].includes(index) ? (
              <Link href={card.href}>
                Start planning <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RenderCta({
  section,
  inventoryKey,
  inventoryCount = 0,
}: {
  section: Extract<DetailSection, { kind: "cta" }>;
  inventoryKey?: string;
  inventoryCount?: number;
}) {
  return (
    <section
      className={`${styles.section} ${styles.cta} above-footer`}
      style={heightStyle(section.height)}
      data-detail-section={section.id}
    >
      <div>
        <h2 className={styles.ctaHeading}>{section.heading}</h2>
        <p className={styles.ctaBody}>{section.body}</p>
        <Link className={styles.ctaLink} href={section.href}>
          {section.label}
        </Link>
        {inventoryKey ? (
          <MediaInventory pageKey={inventoryKey} count={inventoryCount} />
        ) : null}
      </div>
    </section>
  );
}

function RenderSection({
  section,
  nested = false,
  inventoryKey,
  inventoryCount = 0,
}: {
  section: DetailSection;
  nested?: boolean;
  inventoryKey?: string;
  inventoryCount?: number;
}): ReactNode {
  switch (section.kind) {
    case "narrative":
      return (
        <RenderNarrative
          key={section.id}
          section={section}
          nested={nested}
          inventoryKey={inventoryKey}
          inventoryCount={inventoryCount}
        />
      );
    case "team":
      return <RenderTeam key={section.id} section={section} />;
    case "scrub":
      return <RenderScrub key={section.id} section={section} />;
    case "quote":
      return <RenderQuote key={section.id} section={section} nested={nested} />;
    case "gallery":
      return <RenderGallery key={section.id} section={section} nested={nested} />;
    case "cards":
      return <RenderCards key={section.id} section={section} />;
    case "accordion":
      return <RenderAccordion key={section.id} section={section} nested={nested} />;
    case "highlights":
      return <RenderHighlights key={section.id} section={section} />;
    case "itinerary":
      return <RenderItinerary key={section.id} section={section} />;
    case "operations":
      return <RenderOperations key={section.id} section={section} />;
    case "rates":
      return <RenderRates key={section.id} section={section} />;
    case "enquiry":
      return (
        <DetailEnquiryForm
          key={section.id}
          height={section.height}
          inventoryKey={inventoryKey}
          inventoryCount={inventoryCount}
        />
      );
    case "cta":
      return (
        <RenderCta
          key={section.id}
          section={section}
          inventoryKey={inventoryKey}
          inventoryCount={inventoryCount}
        />
      );
  }
}

export function DetailDocument({ page }: { readonly page: DetailPage }) {
  const inventoryByPath: Record<string, number> = {
    "/about/founders": 5,
    "/about/foundation": 6,
    "/about/sustainability": 3,
    "/camps/echo-base": 16,
    "/camps/explorer-camp": 16,
    "/camps/whichaway-camp": 16,
    "/itineraries/discovery-week": 20,
    "/itineraries/south-pole-emperor-penguins": 20,
    "/itineraries/south-pole-blue-rivers": 21,
    "/itineraries/antarctica-in-a-day": 14,
    "/itineraries/early-emperor-penguins": 16,
    "/itineraries/the-long-stay": 23,
    "/prices": 40,
    "/enquire": 1,
  };
  const inventoryKey = page.hero.src.replace(/-1\.webp$/, "");
  const inventoryCount = inventoryByPath[page.path] ?? 0;
  const pageSections = page.sections
    .filter(
      (section) =>
        !(
          page.path === "/itineraries/antarctica-in-a-day" &&
          (section.id === "feature-3" || section.id === "feature-4")
        ),
    )
    .map((section, index, sections) =>
      RenderSection({
        section,
        inventoryKey: index === sections.length - 1 ? inventoryKey : undefined,
        inventoryCount: index === sections.length - 1 ? inventoryCount : 0,
      }),
    );
  const navView = <DetailNav page={page} />;
  const heroView = <DetailHero page={page} />;
  const navBeforeHero = page.family.startsWith("about") || page.family === "region";

  return (
    <MotionStage>
      {navBeforeHero ? navView : null}
      {heroView}
      {!navBeforeHero && page.nav ? navView : null}
      {pageSections}
    </MotionStage>
  );
}
