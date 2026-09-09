import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

type LegalSlug =
  | "website-terms"
  | "booking-terms"
  | "privacy-policy"
  | "cookies"
  | "medical-disclaimer";

interface LegalExpectation {
  readonly slug: LegalSlug;
  readonly bannerTitle: string;
  /**
   * The target emits document titles as h1s as well as the banner title. The
   * renderer promotes the banner to the page h1 and keeps document titles at
   * h2 so the app still has one accessible page heading.
   */
  readonly headingLevels: Readonly<{
    readonly h2: readonly string[];
    readonly h3: readonly string[];
    readonly h4: readonly string[];
  }>;
  readonly materialText: readonly string[];
  readonly links: readonly { readonly text: string; readonly href: string }[];
  /** Target main/legal-clone height measured at desktop, tablet, and mobile. */
  readonly heights: readonly [number, number, number];
}

const expectations: readonly LegalExpectation[] = [
  {
    slug: "website-terms",
    bannerTitle: "Terms of Service",
    headingLevels: {
      h2: ["Website Terms of Use"],
      h3: [
        "1. ACCEPTANCE OF TERMS",
        "2. PURPOSE OF THE WEBSITE",
        "3. NO RELIANCE ON WEBSITE CONTENT",
        "4. PRIVACY AND COOKIES",
        "5. USER SUBMISSIONS",
        "6. ACCEPTABLE USE",
        "7. INTELLECTUAL PROPERTY",
        "8. THIRD‑PARTY LINKS",
        "9. DISCLAIMER",
        "10. LIMITATION OF LIABILITY",
        "11. INDEMNITY",
        "12. TERMINATION",
        "13. SEVERABILITY",
        "14. GOVERNING LAW AND JURISDICTION",
        "15. CONTACT",
      ],
      h4: [],
    },
    materialText: [
      "1.1 These Terms and Conditions of Use",
      "learn about White Desert, our camps and expeditions;",
      "These Website Terms of Use do not govern expedition bookings.",
    ],
    links: [
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
    ],
    heights: [3994.7, 4848.5, 5155.7],
  },
  {
    slug: "booking-terms",
    bannerTitle: "Booking Terms",
    headingLevels: {
      h2: [
        "Terms and Conditions & Guest Waiver",
        "1. DEFINITIONS",
        "2. ADMINISTRATION",
        "3. TRAVEL AND CANCELLATION INSURANCE",
        "4. PASSPORTS & VISAS",
        "5. EQUIPMENT AND CLOTHING",
        "6. PAYMENT",
        "7. CANCELLATION BY US",
        "8. CANCELLATION BY YOU",
        "9. FORCE MAJEURE",
        "10. CHANGES TO THE PROGRAMME",
        "11. CHANGE OF BOOKING BY YOU",
        "12. MEDICAL REPORTS",
        "13. SOUTH POLE",
        "14. CONDUCT",
        "15. COMPLAINTS",
        "16. AUTHORITY OF GROUP LEADERS",
        "17. LIMITATION OF LIABILITY",
        "18. VOLUNTARY ASSUMPTION OF RISK",
        "19. INVALIDITY",
        "20. DATA PROTECTION",
        "21. ENTIRE AGREEMENT",
        "22. WAIVER",
        "23. ASSIGNMENT",
        "24. OPERATION",
        "25. THIRD PARTY RIGHTS",
        "26. GOVERNING LAW",
        "Deed Of Waiver",
        "Appendix 1: Standard Inclusions & Exclusions",
        "1. STANDARD INCLUSIONS",
        "2. STANDARD EXCLUSIONS",
      ],
      h3: [],
      h4: ["Notice Of Cancellation & Percentage Refund"],
    },
    materialText: [
      "White Desert Limited is in the business of helping people to realise their Antarctic dreams and goals.",
      "Version: March 2026",
      "I HAVE READ THIS DEED OF WAIVER AND I FULLY UNDERSTAND ITS TERMS.",
      "25% of the total programme price",
      "2.10. Any shop purchases",
    ],
    links: [],
    heights: [18355.6, 26770.4, 30699.2],
  },
  {
    slug: "privacy-policy",
    bannerTitle: "Privacy Policy",
    headingLevels: {
      h2: ["PRIVACY POLICY"],
      h3: [
        "1. WHO WE ARE",
        "2. SCOPE OF THIS POLICY",
        "3. PERSONAL DATA WE COLLECT",
        "4. HOW WE USE YOUR INFORMATION",
        "5. LEGAL BASES FOR PROCESSING",
        "6. COOKIES AND TRACKING TECHNOLOGIES",
        "7. SHARING OF PERSONAL DATA",
        "8. INTERNATIONAL DATA TRANSFERS",
        "9. DATA RETENTION",
        "10. YOUR RIGHTS",
        "11. SECURITY",
        "12. CHILDREN",
        "13. CHANGES TO THIS POLICY",
        "14. CONTACT US",
      ],
      h4: [
        "3.1 Information you provide directly",
        "3.2 Information collected automatically",
      ],
    },
    materialText: [
      "White Desert respects your privacy and is committed to protecting your personal information.",
      "White Desert South Africa (Pty) Ltd",
      "Google Analytics (GA4)",
      "info@white-desert.com",
    ],
    links: [
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
      { text: "info@white-desert.com", href: "mailto:info@white-desert.com" },
      { text: "info@white-desert.com", href: "mailto:info@white-desert.com" },
    ],
    heights: [5435, 6058.1, 6475.7],
  },
  {
    slug: "cookies",
    bannerTitle: "Cookie Policy",
    headingLevels: {
      h2: ["COOKIES POLICY"],
      h3: [
        "1. WHAT ARE COOKIES?",
        "2. TYPES OF COOKIES WE USE",
        "3. THIRD-PARTY COOKIES",
        "4. COOKIE CONSENT AND CONTROL",
        "5. INTERNATIONAL DATA TRANSFERS",
        "6. UPDATES TO THIS POLICY",
        "7. CONTACT US",
      ],
      h4: [
        "2.1 Strictly Necessary Cookies",
        "2.2 Analytics and Performance Cookies",
        "2.3 Marketing and CRM Cookies",
      ],
    },
    materialText: [
      "This Cookies Policy explains how White Desert uses cookies",
      "Session cookies",
      "Google Analytics (GA4)",
      "HubSpot tracking and marketing cookies",
      "info@white-desert.com",
    ],
    links: [
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
      { text: "www.white-desert.com", href: "http://www.white-desert.com/" },
      { text: "info@white-desert.com", href: "mailto:info@white-desert.com" },
    ],
    heights: [3992.3, 4418.5, 4607.5],
  },
  {
    slug: "medical-disclaimer",
    bannerTitle: "Medical Disclaimer",
    headingLevels: { h2: [], h3: [], h4: [] },
    materialText: [],
    links: [],
    heights: [1721, 1925.6, 1628.6],
  },
];

for (const expectation of expectations) {
  test.describe(`/legal/${expectation.slug}`, () => {
    for (const [viewportIndex, viewport] of viewports.entries()) {
      test(`matches target topology and content at ${viewport.name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(`/legal/${expectation.slug}`);
        await page.evaluate(() => document.fonts?.ready);

        const root = page.locator("main > [data-legal-clone]");
        await expect(root).toHaveCount(1);
        const rootChildren = root.locator(":scope > *");
        await expect(rootChildren).toHaveCount(2);
        await expect(rootChildren.nth(0)).toHaveClass(/fixed-banner-loader/);
        await expect(rootChildren.nth(1)).toHaveAttribute(
          "data-legal-document-section",
          "true",
        );
        await expect(root.locator("[data-legal-banner]")).toHaveCount(1);
        await expect(root.locator("[data-legal-document-section]")).toHaveCount(1);
        await expect(
          root.locator("[data-legal-placeholder], [data-owner-content]"),
        ).toHaveCount(0);

        const banner = root.locator("[data-legal-banner]");
        await expect(banner.locator("h1")).toHaveText(expectation.bannerTitle);
        await expect(banner.locator("h1")).toHaveCSS("text-transform", "uppercase");
        const bannerImage = root.locator(".fixed-banner_bg img");
        await expect(bannerImage).toHaveCount(1);
        await expect(bannerImage).toHaveAttribute(
          "alt",
          "Enquiry page banner background image",
        );
        await expect(bannerImage).toHaveAttribute(
          "src",
          /media%2Ftarget%2Flegal%2FWhiteDesertAntarcticaPeaks\.webp/,
        );

        const documentSection = root.locator("[data-legal-document-section]");
        for (const [level, headings] of Object.entries(expectation.headingLevels)) {
          const locator = documentSection.locator(level);
          await expect(locator).toHaveCount(headings.length);
          await expect(locator.allTextContents()).resolves.toEqual(headings);
        }

        const text = await documentSection.innerText();
        for (const fragment of expectation.materialText) {
          expect(text).toContain(fragment);
        }

        const links = documentSection.getByRole("link");
        await expect(links).toHaveCount(expectation.links.length);
        for (const [linkIndex, link] of expectation.links.entries()) {
          await expect(links.nth(linkIndex)).toHaveText(link.text);
          await expect(links.nth(linkIndex)).toHaveAttribute("href", link.href);
        }

        const height = await root.evaluate(
          (element) => element.getBoundingClientRect().height,
        );
        expect(
          Math.abs(height - expectation.heights[viewportIndex]),
          `target-derived legal main height tolerance is ±1px at ${viewport.name}`,
        ).toBeLessThanOrEqual(1);
      });
    }
  });
}
