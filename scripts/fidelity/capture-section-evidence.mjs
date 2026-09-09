import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

import { routeManifest, routeSlug, viewports } from "./route-manifest.mjs";

export const SECTION_GATE_EVIDENCE_SCHEMA_VERSION = "full-page-section-evidence/v1";
export const SECTION_MANIFEST_SCHEMA_VERSION = "full-page-section-manifest/v1";
export const DEFAULT_MANIFEST_DIR = "scripts/fidelity/manifests/section-gate";
export const DEFAULT_ARTIFACT_ROOT = "artifacts/reference/section-gate";
export const DEFAULT_TARGET_TOP_ROOT = "artifacts/reference/target";
export const DEFAULT_IMPLEMENTATION_TOP_ROOT = "artifacts/reference/actual";

const allowedRoles = new Set(["reference", "implementation"]);
const allowedMotions = new Set(["reduce", "no-preference"]);
const allowedOptions = new Set([
  "base-url",
  "help",
  "manifest-dir",
  "mode",
  "motion",
  "out",
  "role",
  "route",
  "viewport",
]);
const viewportByName = new Map(viewports.map((viewport) => [viewport.name, viewport]));
const routeByPath = new Map(routeManifest.map((route) => [route.path, route]));
const safePathSegment = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const MOTION_CANDIDATE_SELECTOR = [
  "[data-motion-layer]",
  "[data-scroll-speed]",
  ".mist-transition_image-container",
  ".clouds-overlay_wrap",
  ".sticky-split_slider",
  ".gallery-slider",
  ".about-scrub_component",
  "[data-reveal-media]",
  // The target's Patrick Woodhead signature has no motion data attribute.
  // Its component class is the only durable public identifier in the live DOM.
  ".home-quote_svg",
].join(", ");

const MOTION_CLASS_ALIASES = Object.freeze({
  "home-quote_svg": "founder-signature",
});

/**
 * The full-page section gate intentionally distinguishes measurement from
 * screenshot evidence. `--mode=manifest-only` records live geometry and
 * motion samples without inventing image paths; `--mode=capture` adds every
 * required artifact and writes the same manifest shape.
 */
export const captureModes = new Set(["capture", "manifest-only"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function hasPathTraversal(value) {
  return value.split(/[\\/]+/u).some((segment) => segment === "..");
}

export function parseCaptureSectionArguments(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (typeof argument !== "string" || !argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument ?? ""}`);
    }

    const separator = argument.indexOf("=");
    const key = argument.slice(2, separator === -1 ? undefined : separator);
    if (!allowedOptions.has(key)) throw new Error(`Unknown option: --${key}.`);
    if (Object.hasOwn(args, key)) throw new Error(`Duplicate option: --${key}.`);

    if (key === "help" && separator === -1) {
      args[key] = true;
      continue;
    }

    let value = separator === -1 ? argv[index + 1] : argument.slice(separator + 1);
    if (separator === -1) index += 1;
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      throw new Error(`Option --${key} requires a value.`);
    }
    args[key] = value;
  }
  return args;
}

export function validateCaptureSectionOptions(options) {
  if (!isNonEmptyString(options?.role) || !allowedRoles.has(options.role)) {
    throw new Error("--role must be reference or implementation.");
  }
  if (!isNonEmptyString(options.baseUrl)) {
    throw new Error("--base-url must be a non-empty URL.");
  }
  let baseUrl;
  try {
    baseUrl = new URL(options.baseUrl);
  } catch {
    throw new Error(`--base-url is not a valid URL: ${options.baseUrl}`);
  }
  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error("--base-url must use http or https.");
  }

  const mode = options.mode ?? "capture";
  if (!captureModes.has(mode)) {
    throw new Error(`--mode must be one of: ${[...captureModes].join(", ")}.`);
  }
  const motion = options.motion ?? "reduce";
  if (!allowedMotions.has(motion)) {
    throw new Error(`--motion must be one of: ${[...allowedMotions].join(", ")}.`);
  }

  const route = options.route ?? null;
  if (route !== null && !routeByPath.has(route)) {
    throw new Error(`Unknown route: ${route}`);
  }
  const viewport = options.viewport ?? null;
  if (viewport !== null && !viewportByName.has(viewport)) {
    throw new Error(`Unknown viewport: ${viewport}`);
  }

  return {
    role: options.role,
    baseUrl: baseUrl.href.replace(/\/$/u, ""),
    mode,
    motion,
    route,
    viewport,
    manifestDir: options.manifestDir ?? DEFAULT_MANIFEST_DIR,
    artifactRoot: options.out ?? DEFAULT_ARTIFACT_ROOT,
  };
}

function ensureSafePath(value, label) {
  if (!isNonEmptyString(value)) throw new Error(`${label} must be a non-empty path.`);
  if (/[\x00-\x1f\x7f]/u.test(value) || hasPathTraversal(value)) {
    throw new Error(`${label} contains an unsafe path: ${value}`);
  }
  return path.resolve(value);
}

function ensureSafeSegment(value, label) {
  if (!safePathSegment.test(value)) throw new Error(`Unsafe ${label}: ${value}`);
  return value;
}

function resolveWithin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, candidate);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Refusing a path outside ${resolvedRoot}: ${relativePath}`);
  }
  return candidate;
}

function routeForCapture(route) {
  return route.family === "region-index-redirect"
    ? { ...route, effectiveRoute: "/antarctica/wolfs-fang-runway-mountains" }
    : { ...route, effectiveRoute: route.path };
}

function normaliseClassName(value) {
  return String(value ?? "")
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^[A-Za-z0-9_-]+__[^ ]+__/u, ""))
    .filter((token) => !token.includes("module__"))
    .join(" ");
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^A-Za-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .toLowerCase();
}

export function motionIdBase({ explicitId, speed, className, index = 0 }) {
  const classTokens = String(className ?? "")
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter(Boolean);
  const classAlias = classTokens
    .map((token) => MOTION_CLASS_ALIASES[token])
    .find(Boolean);
  return (
    explicitId ||
    (speed ? `scroll-speed-${String(speed).replace(/[^A-Za-z0-9]+/gu, "-")}` : "") ||
    classAlias ||
    classTokens[0] ||
    `motion-${index + 1}`
  );
}

function clampScrollY(value, maxScroll) {
  return Number(Math.min(maxScroll, Math.max(0, value)).toFixed(2));
}

export function motionPhasePlan({ layer, section, viewport, maxScroll }) {
  if (
    layer?.captureProfile === "discrete-draw" &&
    Number.isFinite(layer.triggerDocumentY)
  ) {
    const threshold = layer.triggerDocumentY - viewport.height * 0.75;
    const before = clampScrollY(threshold - 2, maxScroll);
    const after = clampScrollY(threshold + 2, maxScroll);
    return [
      { phase: "start", scrollY: before, waitMs: 80 },
      { phase: "mid", scrollY: after, waitMs: 600 },
      { phase: "end", scrollY: after, waitMs: 700 },
      { phase: "reverse", scrollY: before, waitMs: 1_300 },
    ];
  }

  const bounds = section?.bounds?.[viewport.name];
  const y = Number.isFinite(bounds?.y) ? bounds.y : 0;
  const height = Number.isFinite(bounds?.height) ? bounds.height : viewport.height;
  const end = y + height - viewport.height;
  return [
    { phase: "start", scrollY: clampScrollY(y, maxScroll), waitMs: 80 },
    {
      phase: "mid",
      scrollY: clampScrollY(y + (height - viewport.height) / 2, maxScroll),
      waitMs: 80,
    },
    { phase: "end", scrollY: clampScrollY(end, maxScroll), waitMs: 80 },
    {
      phase: "reverse",
      scrollY: clampScrollY(end - viewport.height / 2, maxScroll),
      waitMs: 80,
    },
  ];
}

/**
 * Stable section names are read from implementation-authored data attributes
 * when available. Target pages do not have those attributes, so their stable
 * fallback is the observed component class/heading descriptor. This keeps the
 * comparator honest: a changed component becomes missing/extra or identity
 * drift instead of silently pairing sections by array position.
 */
export function sectionIdFromDescriptor(descriptor, index, usedIds = new Set()) {
  const attrId = descriptor?.fidelitySection || descriptor?.indexStage;
  const explicitId = isNonEmptyString(attrId) ? slugify(attrId) : "";
  const idSource = explicitId || slugify(descriptor?.id);
  const className = normaliseClassName(descriptor?.className);
  const classTokens = className.split(/\s+/u).filter(Boolean);
  const knownToken = classTokens.find((token) =>
    [
      "hero-banner",
      "home-hero",
      "about-nav_wrap",
      "about-banner-loader",
      "fixed-banner-loader",
      "fixed-banner_wrap-small",
      "basic-banner",
      "above-footer",
      "cards-simple-section",
      "team-members-section",
      "about-scrub_component",
      "sticky-split_slider",
      "gallery-slider",
      "expertise-page_content",
      "itineraries-section",
      "our-camps",
      "cardflick-wrap",
      "rates-body",
      "enquiry-form",
      "legal-document",
    ].includes(token),
  );
  const classId = knownToken
    ? {
        "hero-banner": "hero",
        "home-hero": "hero",
        "about-nav_wrap": "about-navigation",
        "about-banner-loader": "hero",
        "fixed-banner-loader": "hero",
        "fixed-banner_wrap-small": "hero",
        "basic-banner": "planning-cta",
        "above-footer": "planning-cta",
        "cards-simple-section": "more-about-cards",
        "team-members-section": "team",
        "about-scrub_component": "story-scrub",
        "sticky-split_slider": "sticky-split",
        "gallery-slider": "gallery",
        "expertise-page_content": "expertise",
        "itineraries-section": "itineraries",
        "our-camps": "our-camps",
        "cardflick-wrap": "our-trips-cards",
        "rates-body": "rates-body",
        "enquiry-form": "enquiry-form",
        "legal-document": "legal-document",
      }[knownToken]
    : "";
  const headingId = slugify(descriptor?.heading);
  const base =
    idSource ||
    classId ||
    headingId ||
    `${descriptor?.tagName ?? "section"}-${index + 1}`;
  let id = base || `section-${index + 1}`;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function evidencePath(manifestDir, artifactPath) {
  return toPosixPath(path.relative(manifestDir, artifactPath));
}

function artifactFilename(kind, id, position = null) {
  const safeId = ensureSafeSegment(slugify(id) || "section", "evidence id");
  const safePosition = position
    ? `-${ensureSafeSegment(slugify(position) || "position", "evidence position")}`
    : "";
  return `${kind}-${safeId}${safePosition}.png`;
}

function manifestFilename(route, role) {
  return `${routeSlug(route.path)}-${role}.json`;
}

function existingTopPath(role, routePath, viewport, manifestDir) {
  const root =
    role === "reference" ? DEFAULT_TARGET_TOP_ROOT : DEFAULT_IMPLEMENTATION_TOP_ROOT;
  const candidate = path.resolve(
    root,
    `${routeSlug(routePath)}-${viewport.width}x${viewport.height}-top.png`,
  );
  return path.resolve(manifestDir, candidate) === candidate ? candidate : null;
}

function selectorForRole(role) {
  return role === "reference"
    ? ".page-content"
    : "main#main-content > [data-page-content], main#main-content > [data-index-page-content], main#main-content > .page-content, main#main-content > .stage";
}

async function inspectRoot(page, selector) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return null;
  const root = await locator.elementHandle();
  if (!root) return null;
  await root.dispose();
  return { locator };
}

async function inspectChildren(root, viewport) {
  const childDescriptors = await root.locator(":scope > *").evaluateAll((elements) =>
    elements
      .map((element) => {
        const heading =
          element.querySelector(
            "h1,h2,h3,h4,h5,h6,.layout-title,[data-fidelity-heading]",
          )?.textContent ?? "";
        const text = element.textContent ?? "";
        const links = [...element.querySelectorAll("a[href]")]
          .map((link) => link.getAttribute("href"))
          .filter((href) => typeof href === "string" && href.trim().length > 0)
          .map((href) => {
            try {
              return new URL(href, location.href).pathname;
            } catch {
              return href;
            }
          })
          .filter((href, index, values) => values.indexOf(href) === index)
          .slice(0, 24);
        const assets = [
          ...element.querySelectorAll(
            "img[src],img[srcset],video[src],video source[src]",
          ),
        ]
          .map((media) => media.getAttribute("src") ?? media.getAttribute("srcset"))
          .filter((source) => typeof source === "string" && source.trim().length > 0)
          .filter((source, index, values) => values.indexOf(source) === index)
          .slice(0, 24);
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || "",
          className: element.className || "",
          fidelitySection: element.getAttribute("data-fidelity-section"),
          indexStage: element.getAttribute("data-index-stage"),
          heading: heading.trim().replace(/\s+/gu, " ").slice(0, 240),
          text: text.trim().replace(/\s+/gu, " ").slice(0, 320),
          links,
          assets,
          visible:
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            rect.width > 0 &&
            rect.height > 0,
          shellDecoration: element.matches(
            ".flyout_container, .flyout_popup, .grid-overlay, .custom-cursor",
          ),
          motionDescendant: Boolean(
            element.querySelector(
              "[data-motion-layer],[data-scroll-speed],.sticky-split_slider,.gallery-slider,.about-scrub_component",
            ),
          ),
        };
      })
      .filter(({ shellDecoration }) => !shellDecoration),
  );
  const usedIds = new Set();
  const sections = [];
  for (const [index, descriptor] of childDescriptors.entries()) {
    const id = sectionIdFromDescriptor(descriptor, index, usedIds);
    sections.push({
      id,
      semantic: [
        descriptor.tagName,
        normaliseClassName(descriptor.className),
        descriptor.heading,
      ]
        .filter(Boolean)
        .join(" | "),
      nodeKind: "element",
      captureRequired: true,
      headingPurpose: descriptor.heading || undefined,
      keyLinks: descriptor.links.length > 0 ? descriptor.links : undefined,
      assets: descriptor.assets.length > 0 ? descriptor.assets : undefined,
      visibleState: { default: descriptor.visible ? "visible" : "hidden" },
      motionDisposition: descriptor.motionDescendant
        ? "scroll-or-interaction-linked"
        : "static-flow",
      bounds: {
        [viewport.name]: { y: 0, height: 1 },
      },
      _descriptor: descriptor,
    });
  }
  const measured = await root.locator(":scope > *").evaluateAll((elements) =>
    elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Number(rect.x.toFixed(2)),
          y: Number((rect.y + scrollY).toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
          pinned:
            getComputedStyle(element).position === "sticky" ||
            element.matches("[data-sticky],.sticky-split_slider"),
          shellDecoration: element.matches(
            ".flyout_container, .flyout_popup, .grid-overlay, .custom-cursor",
          ),
        };
      })
      .filter(({ shellDecoration }) => !shellDecoration),
  );
  for (const [index, bounds] of measured.entries()) {
    const pinned = bounds.pinned;
    const measuredBounds = { ...bounds };
    delete measuredBounds.pinned;
    delete measuredBounds.shellDecoration;
    sections[index].bounds[viewport.name] = measuredBounds;
    if (pinned) sections[index].pinned = true;
    delete sections[index]._descriptor;
    for (const key of Object.keys(sections[index])) {
      if (sections[index][key] === undefined) delete sections[index][key];
    }
  }
  return sections;
}

async function inspectSections(root, viewport) {
  const sections = await inspectChildren(root, viewport);
  return { sections, directChildren: sections.map(({ id }) => id) };
}

async function sectionHandles(root) {
  const handles = await root.locator(":scope > *").elementHandles();
  return handles;
}

function sectionById(sections, id) {
  return sections.find((section) => section.id === id) ?? null;
}

async function collectMotionDescriptors(page, rootSelector, sections, viewport) {
  const raw = await page.evaluate(
    ({ rootSelector, candidateSelector }) => {
      const rootElement = document.querySelector(rootSelector);
      if (!rootElement) return [];
      const candidates = [...rootElement.querySelectorAll(candidateSelector)];
      const seen = new Set();
      return candidates.flatMap((element, index) => {
        if (seen.has(element)) return [];
        seen.add(element);
        const sectionElement =
          element.closest("[data-fidelity-section]") ??
          [...rootElement.children].find((child) => child.contains(element));
        const rootChildren = [...rootElement.children];
        const sectionIndex = sectionElement ? rootChildren.indexOf(sectionElement) : -1;
        const className = String(element.className || "")
          .replace(/\s+/gu, " ")
          .trim();
        const explicitId = element.getAttribute("data-motion-layer");
        const speed = element.getAttribute("data-scroll-speed");
        const captureProfile =
          explicitId === "founder-signature" ||
          element.classList.contains("home-quote_svg")
            ? "discrete-draw"
            : "computed-style";
        const triggerElement =
          captureProfile === "discrete-draw"
            ? (element.parentElement ?? element)
            : element;
        const triggerRect = triggerElement.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return [
          {
            explicitId,
            speed,
            index,
            sectionIndex,
            className,
            captureProfile,
            triggerDocumentY: Number((triggerRect.top + scrollY).toFixed(2)),
            property:
              captureProfile === "discrete-draw"
                ? "stroke-dasharray/stroke-dashoffset"
                : style.transform !== "none"
                  ? "transform"
                  : style.filter !== "none"
                    ? "filter"
                    : "visual state",
            trigger:
              captureProfile === "discrete-draw"
                ? "signature wrapper parent top 75%"
                : speed
                  ? `scroll-speed ${speed}`
                  : style.position === "sticky"
                    ? "sticky scroll interval"
                    : explicitId
                      ? "declared motion layer"
                      : "route motion candidate",
            range:
              captureProfile === "discrete-draw"
                ? "six paths draw together from 0% to 100%"
                : style.position === "sticky"
                  ? "pinned section range"
                  : "scroll-linked state",
            easing:
              captureProfile === "discrete-draw"
                ? "power2.inOut over 1.2s"
                : "sampled computed state",
            interruption:
              captureProfile === "discrete-draw"
                ? "play on enter and reverse above the trigger"
                : "reverse and direct scroll checkpoint required",
            reducedMotion: "capture required for selected preference",
            pinned:
              style.position === "sticky" || element.matches(".sticky-split_slider"),
            rect: {
              x: rect.x,
              y: rect.y + scrollY,
              width: rect.width,
              height: rect.height,
            },
          },
        ];
      });
    },
    { rootSelector, candidateSelector: MOTION_CANDIDATE_SELECTOR },
  );

  const deduped = [];
  const ids = new Set();
  for (const descriptor of raw) {
    const rawId = motionIdBase(descriptor);
    let id = slugify(rawId) || "motion-layer";
    let suffix = 2;
    while (ids.has(id)) {
      id = `${slugify(rawId) || "motion-layer"}-${suffix}`;
      suffix += 1;
    }
    ids.add(id);
    const section = sections[descriptor.sectionIndex] ?? sections[0];
    if (!section) continue;
    const layer = {
      ...descriptor,
      id,
      sectionId: section.id,
      samples: {
        [viewport.name]: {
          start: { status: "not-sampled" },
          mid: { status: "not-sampled" },
          end: { status: "not-sampled" },
          reverse: { status: "not-sampled" },
        },
      },
    };
    if (descriptor.pinned) {
      const sectionBounds = section.bounds?.[viewport.name];
      const scrollStart = sectionBounds?.y;
      const scrollEnd =
        Number.isFinite(scrollStart) && Number.isFinite(sectionBounds?.height)
          ? scrollStart + Math.max(0, sectionBounds.height - viewport.height)
          : Number.NaN;
      if (
        Number.isFinite(scrollStart) &&
        Number.isFinite(scrollEnd) &&
        scrollEnd > scrollStart
      ) {
        layer.pinRanges = {
          [viewport.name]: {
            scrollStart: Number(scrollStart.toFixed(2)),
            scrollEnd: Number(scrollEnd.toFixed(2)),
            verticalDistance: Number((scrollEnd - scrollStart).toFixed(2)),
            horizontalDistance: 0,
          },
        };
      } else {
        delete layer.pinned;
      }
    }
    delete layer.sectionIndex;
    delete layer.className;
    delete layer.explicitId;
    delete layer.speed;
    delete layer.index;
    delete layer.rect;
    deduped.push(layer);
  }
  return deduped;
}

async function sampleMotionPhase(page, rootSelector, viewport, phase) {
  return page.evaluate(
    ({ rootSelector, viewport, phase, candidateSelector, classAliases }) => {
      const normaliseId = (value) =>
        String(value ?? "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/gu, "")
          .replace(/[^A-Za-z0-9]+/gu, "-")
          .replace(/^-+|-+$/gu, "")
          .toLowerCase();
      const root = document.querySelector(rootSelector);
      if (!root) return {};
      const candidates = [...root.querySelectorAll(candidateSelector)];
      const used = new Map();
      const values = {};
      for (const [index, element] of candidates.entries()) {
        const speed = element.getAttribute("data-scroll-speed");
        const explicitId = element.getAttribute("data-motion-layer");
        const className = String(element.className || "")
          .replace(/\s+/gu, " ")
          .trim();
        const classTokens = className.split(" ").filter(Boolean);
        const classAlias = classTokens
          .map((token) => classAliases[token])
          .find(Boolean);
        const rawBase =
          explicitId ||
          (speed ? `scroll-speed-${speed.replace(/[^A-Za-z0-9]+/gu, "-")}` : "") ||
          classAlias ||
          classTokens[0] ||
          `motion-${index + 1}`;
        const base = normaliseId(rawBase) || `motion-${index + 1}`;
        const count = (used.get(base) ?? 0) + 1;
        used.set(base, count);
        const id = count === 1 ? base : `${base}-${count}`;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const sample = {
          phase,
          scrollY: Number(scrollY.toFixed(2)),
          transform: style.transform,
          filter: style.filter,
          opacity: style.opacity,
          visibility: style.visibility,
          x: Number(rect.x.toFixed(2)),
          y: Number((rect.y + scrollY).toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
          viewport: { width: viewport.width, height: viewport.height },
        };
        if (id === "founder-signature") {
          sample.drawRatios = [...element.querySelectorAll("path")].map((path) => {
            const length = path.getTotalLength();
            const drawn = Number.parseFloat(getComputedStyle(path).strokeDasharray);
            return Number.isFinite(drawn) && length > 0
              ? Number((drawn / length).toFixed(3))
              : 1;
          });
        }
        values[id] = sample;
      }
      return values;
    },
    {
      rootSelector,
      viewport,
      phase,
      candidateSelector: MOTION_CANDIDATE_SELECTOR,
      classAliases: MOTION_CLASS_ALIASES,
    },
  );
}

function makeEvidencePaths({
  manifestDir,
  artifactDir,
  sections,
  layers,
  mode,
  pendingTopPath = null,
}) {
  if (mode !== "capture") {
    return {
      top: pendingTopPath ? { path: evidencePath(manifestDir, pendingTopPath) } : null,
      fullPage: null,
      sectionCaptures: [],
      checkpoints: [],
      motionCaptures: [],
    };
  }
  const capturableSections = sections.filter(
    (section) => section.nodeKind !== "virtual" && section.captureRequired !== false,
  );
  const topPath = path.join(artifactDir, "top.png");
  const fullPagePath = path.join(artifactDir, "full-page.png");
  const evidence = {
    top: { path: evidencePath(manifestDir, topPath) },
    fullPage: { path: evidencePath(manifestDir, fullPagePath) },
    sectionCaptures: capturableSections.map((section) => ({
      sectionId: section.id,
      path: evidencePath(
        manifestDir,
        path.join(artifactDir, "sections", artifactFilename("section", section.id)),
      ),
    })),
    checkpoints: capturableSections.flatMap((section) => {
      const positions = ["start", "center", "end"];
      if (section.pinned) positions.push("pin-start", "pin-mid", "pin-end");
      if (section.isFooter) positions.push("footer");
      return positions.map((position) => ({
        sectionId: section.id,
        position,
        path: evidencePath(
          manifestDir,
          path.join(
            artifactDir,
            "checkpoints",
            artifactFilename("checkpoint", section.id, position),
          ),
        ),
      }));
    }),
    motionCaptures: layers.flatMap((layer) =>
      ["start", "mid", "end", "reverse"].map((phase) => ({
        layerId: layer.id,
        phase,
        path: evidencePath(
          manifestDir,
          path.join(artifactDir, "motion", artifactFilename("motion", layer.id, phase)),
        ),
      })),
    ),
  };
  return evidence;
}

function viewportRecord(viewport, scrollHeight, evidence) {
  return {
    width: viewport.width,
    height: viewport.height,
    scrollHeight: Number(scrollHeight.toFixed(2)),
    evidence,
  };
}

function mergeMotionLayers(allLayers) {
  const byId = new Map();
  for (const layer of allLayers) {
    const previous = byId.get(layer.id);
    if (!previous) {
      byId.set(layer.id, structuredClone(layer));
      continue;
    }
    previous.samples = { ...previous.samples, ...layer.samples };
    previous.pinRanges = { ...previous.pinRanges, ...layer.pinRanges };
    if (layer.pinned) previous.pinned = true;
    previous.sectionId = previous.sectionId || layer.sectionId;
  }
  return [...byId.values()];
}

export function motionIsComplete(mode, layers, evidenceByViewport) {
  if (mode !== "capture") return false;
  // A captured route with no motion candidates has no phase evidence to
  // collect. The empty inventory is the measured result. Manifest-only
  // deliberately stays incomplete because it does not write pixels.
  if (layers.length === 0) return true;
  return evidenceByViewport.every(({ viewport, evidence }) =>
    layers.every((layer) =>
      ["start", "mid", "end", "reverse"].every((phase) => {
        const sample = layer.samples?.[viewport]?.[phase];
        return (
          isRecord(sample) &&
          sample.status !== "missing" &&
          sample.status !== "not-sampled" &&
          evidence.motionCaptures.some(
            (capture) =>
              capture.layerId === layer.id && capture.phase === phase && capture.path,
          )
        );
      }),
    ),
  );
}

async function hashFile(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

function installPageDiagnostics(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  return errors;
}

function assertPageDiagnostics(errors, context) {
  if (errors.length === 0) return;
  const unique = [...new Set(errors)];
  throw new Error(
    `${context} emitted browser errors:\n${unique.slice(0, 8).join("\n")}`,
  );
}

function recordedDiagnostics(errors) {
  return [...new Set(errors)];
}

/**
 * DOMContentLoaded is not a hydration boundary in an App Router build. Wait
 * for a complete document and a pair of mutation-free animation frames before
 * allowing the harness to mutate styles or measure geometry. The bounded
 * retry also covers streamed Next payloads that finish after load.
 */
export async function waitForPageHydration(page, { timeout = 15_000 } = {}) {
  const deadline = Date.now() + timeout;
  await page.waitForLoadState("load", { timeout }).catch(() => {});
  while (Date.now() < deadline) {
    const state = await page.evaluate(async () => {
      const root = document.documentElement;
      let mutationCount = 0;
      const observer = new MutationObserver((records) => {
        mutationCount += records.length;
      });
      observer.observe(root, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      observer.disconnect();
      return {
        ready: document.readyState === "complete",
        stable: mutationCount === 0,
      };
    });
    if (state.ready && state.stable) return;
    await page.waitForTimeout(50);
  }
  throw new Error("Timed out waiting for a hydrated, mutation-stable document.");
}

async function waitForFiniteAnimations(page, { timeout = 15_000 } = {}) {
  await page.waitForFunction(
    () =>
      document.getAnimations({ subtree: true }).every((animation) => {
        if (animation.playState !== "running") return true;
        const endTime = animation.effect?.getComputedTiming()?.endTime;
        return !Number.isFinite(endTime) || endTime <= 0;
      }),
    { timeout },
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

async function writeScreenshot(page, filePath, options = {}) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, scale: "css", caret: "hide", ...options });
  const metadata = await sharp(filePath).metadata();
  return {
    path: filePath,
    sha256: await hashFile(filePath),
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

async function waitForVisualReadiness(page, { waitForImages = true } = {}) {
  await waitForPageHydration(page);
  await page.evaluate(async (shouldWaitForImages) => {
    await document.fonts.ready;
    if (!shouldWaitForImages) return;
    const pendingImages = [...document.images].filter((image) => !image.complete);
    await Promise.all(
      pendingImages.map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 5000);
          }),
      ),
    );
  }, waitForImages);
  // Lazy images and streamed React nodes may settle after the first boundary;
  // re-check before the harness injects any style or measures geometry.
  await waitForPageHydration(page);
  await waitForFiniteAnimations(page);
  await page.addStyleTag({
    content:
      "html { scroll-behavior: auto !important; } .cookie-banner { display: none !important; }",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

async function currentScrollHeight(page) {
  return await page.evaluate(() =>
    Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0),
  );
}

async function scrollPositionFor(page, section, position, viewport) {
  const maxScroll = Math.max(0, (await currentScrollHeight(page)) - viewport.height);
  const y = section.bounds?.[viewport.name]?.y ?? 0;
  const height = section.bounds?.[viewport.name]?.height ?? viewport.height;
  const raw =
    position === "center"
      ? y + (height - viewport.height) / 2
      : position === "end" || position === "pin-end"
        ? y + height - viewport.height
        : position === "pin-mid"
          ? y + Math.max(0, (height - viewport.height) / 2)
          : y;
  return Math.min(maxScroll, Math.max(0, raw));
}

async function captureRouteViewport({
  page,
  route,
  viewport,
  role,
  baseUrl,
  mode,
  motion,
  manifestDir,
  artifactRoot,
}) {
  const captureRoute = routeForCapture(route);
  const diagnostics = installPageDiagnostics(page);
  const requestedUrl = new URL(route.path, `${baseUrl}/`).href;
  const response = await page.goto(requestedUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await waitForVisualReadiness(page, { waitForImages: mode === "capture" });
  // A reference can contain defects that the clone must observe and document;
  // it must not become impossible to capture merely because the target emits a
  // browser diagnostic. The implementation remains fail-fast because a local
  // console or hydration error invalidates release evidence.
  if (role === "implementation") {
    assertPageDiagnostics(diagnostics, `${role} ${route.path}`);
  }
  const rootSelector = selectorForRole(role);
  const root = await inspectRoot(page, rootSelector);
  if (!root) {
    throw new Error(
      `${role} ${route.path} has no content root matching ${rootSelector}.`,
    );
  }
  const inspected = await inspectSections(root.locator, viewport);
  const layers = await collectMotionDescriptors(
    page,
    rootSelector,
    inspected.sections,
    viewport,
  );
  const scrollHeight = await currentScrollHeight(page);
  const artifactDir = path.join(
    artifactRoot,
    role,
    ensureSafeSegment(motion, "motion preference"),
    ensureSafeSegment(routeSlug(route.path), "route slug"),
    ensureSafeSegment(viewport.name, "viewport"),
  );
  const evidence = makeEvidencePaths({
    manifestDir,
    artifactDir,
    sections: inspected.sections,
    layers,
    mode,
    pendingTopPath: existingTopPath(role, route.path, viewport, manifestDir),
  });
  const evidenceByViewport = [{ evidence }];

  if (layers.length > 0) {
    const sectionForLayer = (layer) => sectionById(inspected.sections, layer.sectionId);
    const maxScroll = Math.max(0, scrollHeight - viewport.height);
    for (const layer of layers) {
      const plan = motionPhasePlan({
        layer,
        section: sectionForLayer(layer),
        viewport,
        maxScroll,
      });
      for (const step of plan) {
        await page.evaluate((y) => window.scrollTo(0, y), step.scrollY);
        await page.waitForTimeout(step.waitMs);
        const samples = await sampleMotionPhase(
          page,
          rootSelector,
          viewport,
          step.phase,
        );
        layer.samples[viewport.name][step.phase] = samples[layer.id] ?? {
          status: "missing",
        };
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  if (mode === "capture") {
    const topCapture = await writeScreenshot(page, path.join(artifactDir, "top.png"));
    await writeScreenshot(page, path.join(artifactDir, "full-page.png"), {
      fullPage: true,
    });
    evidence.top = {
      path: evidencePath(manifestDir, topCapture.path),
      sha256: topCapture.sha256,
      width: topCapture.width,
      height: topCapture.height,
    };
    for (const section of inspected.sections) {
      const sectionHandle = (await sectionHandles(root.locator))[
        inspected.sections.indexOf(section)
      ];
      if (sectionHandle) {
        const outputPath = resolveWithin(
          artifactDir,
          path.join("sections", artifactFilename("section", section.id)),
        );
        await mkdir(path.dirname(outputPath), { recursive: true });
        await sectionHandle.screenshot({
          path: outputPath,
          scale: "css",
          caret: "hide",
        });
      }
      for (const checkpoint of evidence.checkpoints.filter(
        ({ sectionId }) => sectionId === section.id,
      )) {
        const scrollY = await scrollPositionFor(
          page,
          section,
          checkpoint.position,
          viewport,
        );
        await page.evaluate((y) => window.scrollTo(0, y), scrollY);
        await page.waitForTimeout(80);
        await writeScreenshot(page, path.resolve(manifestDir, checkpoint.path), {
          fullPage: false,
        });
      }
    }
    const maxScroll = Math.max(0, scrollHeight - viewport.height);
    for (const layer of layers) {
      const section = sectionById(inspected.sections, layer.sectionId);
      const plan = motionPhasePlan({ layer, section, viewport, maxScroll });
      for (const step of plan) {
        const motion = evidence.motionCaptures.find(
          (capture) => capture.layerId === layer.id && capture.phase === step.phase,
        );
        if (!motion) continue;
        await page.evaluate((y) => window.scrollTo(0, y), step.scrollY);
        await page.waitForTimeout(step.waitMs);
        await writeScreenshot(page, path.resolve(manifestDir, motion.path), {
          fullPage: false,
        });
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // Scroll, interaction, and screenshot work can trigger diagnostics after
  // the initial readiness boundary. Keep implementation capture fail-fast
  // for those late errors as well; reference diagnostics remain recorded.
  if (role === "implementation") {
    assertPageDiagnostics(diagnostics, `${role} ${route.path}`);
  }

  const topPath = mode === "capture" ? evidence.top.path : null;
  return {
    route: route.path,
    effectiveRoute: captureRoute.effectiveRoute,
    family: route.family,
    requestedUrl,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    viewport: viewport.name,
    width: viewport.width,
    height: viewport.height,
    scrollHeight,
    rootSelector,
    sections: inspected.sections,
    directChildren: inspected.directChildren,
    layers,
    evidence,
    topPath,
    evidenceByViewport,
    diagnostics: recordedDiagnostics(diagnostics),
  };
}

export function combineRouteRecords({
  route,
  role,
  baseUrl,
  sourceRecords,
  mode,
  motion = "reduce",
}) {
  const first = sourceRecords[0];
  const requiredViewports = sourceRecords.map((record) => record.viewport);
  const sectionOrder = first.directChildren;
  const sections = first.sections.map((section) => ({
    ...section,
    bounds: Object.fromEntries(
      sourceRecords.map((record) => [
        record.viewport,
        record.sections.find(({ id }) => id === section.id)?.bounds?.[
          record.viewport
        ] ?? {},
      ]),
    ),
  }));
  const layers = mergeMotionLayers(sourceRecords.flatMap((record) => record.layers));
  for (const layer of layers) {
    for (const record of sourceRecords) {
      if (!layer.samples?.[record.viewport]) {
        layer.samples ??= {};
        layer.samples[record.viewport] = {
          start: { status: "not-sampled" },
          mid: { status: "not-sampled" },
          end: { status: "not-sampled" },
          reverse: { status: "not-sampled" },
        };
      }
    }
    // A manifest-level pinned layer must carry a usable pin range at every
    // required viewport. A sticky candidate that only has a valid range at
    // one breakpoint remains in the motion inventory, but is intentionally
    // represented as an ordinary scroll-linked layer instead of claiming a
    // complete cross-viewport pin contract.
    if (
      layer.pinned &&
      !sourceRecords.every(({ viewport }) => {
        const range = layer.pinRanges?.[viewport];
        return (
          isRecord(range) &&
          Number.isFinite(range.scrollStart) &&
          Number.isFinite(range.scrollEnd) &&
          range.scrollEnd > range.scrollStart &&
          Number.isFinite(range.verticalDistance) &&
          range.verticalDistance > 0 &&
          Number.isFinite(range.horizontalDistance) &&
          range.horizontalDistance >= 0
        );
      })
    ) {
      delete layer.pinned;
    }
  }
  const evidenceByViewport = sourceRecords.map(({ viewport, evidence }) => ({
    viewport,
    evidence,
  }));
  const artifactStatus = mode === "capture" ? "captured" : "pending-capture";
  const allMotionEvidence = motionIsComplete(mode, layers, evidenceByViewport);
  const diagnostics = recordedDiagnostics(
    sourceRecords.flatMap((record) => record.diagnostics ?? []),
  );
  return {
    schemaVersion: SECTION_MANIFEST_SCHEMA_VERSION,
    manifestId: `${routeSlug(route.path)}-${role}-v1`,
    role,
    route: route.path,
    family: route.family,
    scope: { kind: "route-content", id: `${routeSlug(route.path)}-content` },
    source: {
      url: baseUrl,
      requestedRoute: route.path,
      motionPreference: motion,
      finalRoutes: [
        ...new Set(sourceRecords.map(({ effectiveRoute }) => effectiveRoute)),
      ],
      observedAt: new Date().toISOString(),
      contentRoot: first.rootSelector,
      status: artifactStatus,
      captureMode: mode,
      evidenceStatus: artifactStatus,
      ...(diagnostics.length > 0 ? { diagnostics } : {}),
    },
    requiredViewports,
    tolerances: { boundsPx: 2, scrollHeightPx: 2 },
    domTopology: { scope: first.rootSelector, directChildren: sectionOrder },
    sections,
    viewports: Object.fromEntries(
      sourceRecords.map((record) => [
        record.viewport,
        viewportRecord(
          { name: record.viewport, width: record.width, height: record.height },
          record.scrollHeight,
          record.evidence,
        ),
      ]),
    ),
    motion: {
      status: allMotionEvidence ? "complete" : "incomplete",
      ...(allMotionEvidence
        ? {}
        : {
            unknown: [
              "motion evidence remains pending until four phase captures exist for every layer and viewport",
            ],
          }),
      layers,
    },
  };
}

function shellSelectorForRole(role) {
  return role === "reference"
    ? {
        navigation: "body > nav",
        // The target keeps the trigger/flyout in a fixed container mounted
        // inside the page main, rather than as children of the nav/footer.
        trigger: "body .flyout_container .btn-popup-open",
        flyout: "body .flyout_popup",
        footer: "body > .footer-component",
      }
    : {
        // The header's class names became module-scoped and hashed with the
        // authorized ADELVA navigation replacement, so the local role resolves
        // the same element through the landmark hook it has always carried.
        navigation: 'body [data-fidelity-landmark="header-nav"]',
        trigger: "body .how-it-works .how-it-works__trigger",
        flyout: "body .how-it-works .how-it-works__panel",
        footer: "body .colophon",
      };
}

async function inspectShell(
  page,
  viewport,
  role,
  manifestDir,
  artifactRoot,
  mode,
  motion,
) {
  const selectors = shellSelectorForRole(role);
  const entries = [];
  for (const [id, selector] of Object.entries({
    "global-navigation": selectors.navigation,
    "how-it-works-trigger": selectors.trigger,
    "how-it-works-flyout": selectors.flyout,
    "site-footer": selectors.footer,
  })) {
    const locator = page.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      entries.push({
        id,
        selector,
        missing: true,
        semantic:
          id === "global-navigation"
            ? "global navigation"
            : id === "site-footer"
              ? "global footer"
              : id === "how-it-works-trigger"
                ? "How it works trigger"
                : "How it works flyout",
      });
      continue;
    }
    const data = await locator.evaluate(
      (element, descriptor) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const heading = element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent ?? "";
        return {
          id: descriptor.id,
          semantic: descriptor.semantic,
          selector: descriptor.selector,
          bounds: {
            x: Number(rect.x.toFixed(2)),
            y: Number((rect.y + scrollY).toFixed(2)),
            width: Number(rect.width.toFixed(2)),
            height: Number(rect.height.toFixed(2)),
          },
          heading: heading.trim().replace(/\s+/gu, " ").slice(0, 240),
          visible: style.visibility !== "hidden" && style.display !== "none",
        };
      },
      {
        id,
        semantic:
          id === "global-navigation"
            ? "global navigation"
            : id === "site-footer"
              ? "global footer"
              : id === "how-it-works-trigger"
                ? "How it works trigger"
                : "How it works flyout",
        selector,
      },
    );
    if (data.bounds.width <= 0 || data.bounds.height <= 0) {
      entries.push({ ...data, missing: true });
    } else {
      entries.push(data);
    }
  }
  const scrollHeight = await currentScrollHeight(page);
  const artifactDir = path.join(
    artifactRoot,
    role,
    ensureSafeSegment(motion, "motion preference"),
    "global-shell",
    viewport.name,
  );
  const sectionRecords = entries.map((entry) => ({
    id: entry.id,
    semantic: entry.semantic,
    nodeKind: entry.missing ? "virtual" : "element",
    captureRequired: !entry.missing,
    ...(entry.id === "site-footer" ? { isFooter: true } : {}),
    ...(entry.missing
      ? {}
      : {
          bounds: { [viewport.name]: entry.bounds },
          visibleState: { default: entry.visible ? "visible" : "hidden" },
        }),
  }));
  const evidence = makeEvidencePaths({
    manifestDir,
    artifactDir,
    sections: sectionRecords,
    layers: [
      {
        id: "how-it-works-flyout-transition",
        sectionId: "how-it-works-flyout",
      },
    ],
    mode,
    pendingTopPath: existingTopPath(role, "/", viewport, manifestDir),
  });
  const motionLayer = {
    id: "how-it-works-flyout-transition",
    sectionId: "how-it-works-flyout",
    property: "interactive visibility and translateX",
    trigger: "How it works shell trigger",
    range: "closed -> open -> closed",
    easing: "sampled computed state",
    interruption: "close/reopen and Escape must return to closed state",
    reducedMotion: "capture required for selected preference",
    samples: {
      [viewport.name]: {
        start: { status: "not-sampled" },
        mid: { status: "not-sampled" },
        end: { status: "not-sampled" },
        reverse: { status: "not-sampled" },
      },
    },
  };
  if (mode === "capture") {
    const top = await writeScreenshot(page, path.join(artifactDir, "top.png"));
    await writeScreenshot(page, path.join(artifactDir, "full-page.png"), {
      fullPage: true,
    });
    evidence.top = {
      path: evidencePath(manifestDir, top.path),
      sha256: top.sha256,
      width: top.width,
      height: top.height,
    };
    for (const section of sectionRecords.filter(
      ({ nodeKind }) => nodeKind !== "virtual",
    )) {
      const locator = page
        .locator(
          selectors[
            section.id === "global-navigation"
              ? "navigation"
              : section.id === "how-it-works-trigger"
                ? "trigger"
                : section.id === "how-it-works-flyout"
                  ? "flyout"
                  : "footer"
          ],
        )
        .first();
      const destination = path.join(
        artifactDir,
        "sections",
        artifactFilename("section", section.id),
      );
      await mkdir(path.dirname(destination), { recursive: true });
      await locator.screenshot({ path: destination, scale: "css", caret: "hide" });
      for (const checkpoint of evidence.checkpoints.filter(
        ({ sectionId }) => sectionId === section.id,
      )) {
        await page.evaluate(
          (y) => window.scrollTo(0, y),
          section.bounds[viewport.name].y,
        );
        await page.waitForTimeout(80);
        await writeScreenshot(page, path.resolve(manifestDir, checkpoint.path));
      }
    }
    const trigger = page.locator(selectors.trigger).first();
    const flyout = page.locator(selectors.flyout).first();
    const canSampleInteractiveShell =
      (await trigger.count()) > 0 &&
      (await flyout.count()) > 0 &&
      (await trigger.boundingBox()) !== null &&
      (await flyout.boundingBox()) !== null;
    if (!canSampleInteractiveShell) {
      // Keep the layer in the inventory, but do not publish paths for
      // screenshots that cannot be taken. This leaves the shell explicitly
      // incomplete instead of making a missing target control look captured.
      evidence.motionCaptures = [];
    }
    const sampleShellMotion = async (phase) => {
      if (!canSampleInteractiveShell) {
        motionLayer.samples[viewport.name][phase] = { status: "missing" };
        return;
      }
      const sample = await flyout.evaluate((element, phaseName) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          phase: phaseName,
          transform: style.transform,
          opacity: style.opacity,
          visibility: style.visibility,
          x: Number(rect.x.toFixed(2)),
          y: Number(rect.y.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
        };
      }, phase);
      motionLayer.samples[viewport.name][phase] = sample;
    };
    await page.evaluate(() => window.scrollTo(0, 0));
    await sampleShellMotion("start");
    if (canSampleInteractiveShell) {
      await trigger.click();
      await page.waitForTimeout(120);
    }
    await sampleShellMotion("mid");
    if (canSampleInteractiveShell) {
      await page.waitForTimeout(300);
    }
    await sampleShellMotion("end");
    if (canSampleInteractiveShell) {
      await trigger.click();
      await page.waitForTimeout(120);
    }
    await sampleShellMotion("reverse");
    for (const motion of evidence.motionCaptures) {
      const destination = path.resolve(manifestDir, motion.path);
      if (!canSampleInteractiveShell) continue;
      if (motion.phase === "start") {
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (motion.phase === "mid") {
        await trigger.click();
        await page.waitForTimeout(120);
      } else if (motion.phase === "end") {
        await page.waitForTimeout(300);
      } else if (motion.phase === "reverse") {
        await trigger.click();
        await page.waitForTimeout(120);
      }
      await writeScreenshot(page, destination, { fullPage: false });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  return {
    viewport,
    width: viewport.width,
    height: viewport.height,
    scrollHeight,
    sections: sectionRecords,
    evidence,
    layers: [motionLayer],
  };
}

export function combineShellRecords({
  role,
  baseUrl,
  records,
  mode,
  motion = "reduce",
}) {
  const first = records[0];
  const layers = mergeMotionLayers(records.flatMap((record) => record.layers ?? []));
  const diagnostics = recordedDiagnostics(
    records.flatMap((record) => record.diagnostics ?? []),
  );
  const missingSectionIds = new Set(
    first.sections
      .filter((section) =>
        records.some(
          (record) =>
            !record.sections.some(
              ({ id, nodeKind }) => id === section.id && nodeKind !== "virtual",
            ),
        ),
      )
      .map(({ id }) => id),
  );
  for (const layer of layers) {
    for (const record of records) {
      if (!layer.samples[record.viewport.name]) {
        layer.samples[record.viewport.name] = {
          start: { status: "not-sampled" },
          mid: { status: "not-sampled" },
          end: { status: "not-sampled" },
          reverse: { status: "not-sampled" },
        };
      }
    }
  }
  const evidenceByViewport = records.map((record) => ({
    viewport: record.viewport.name,
    evidence: record.evidence,
  }));
  const allMotionEvidence = motionIsComplete(mode, layers, evidenceByViewport);
  const cleanEvidence = (evidence) => ({
    ...evidence,
    sectionCaptures: (evidence.sectionCaptures ?? []).filter(
      ({ sectionId }) => !missingSectionIds.has(sectionId),
    ),
    checkpoints: (evidence.checkpoints ?? []).filter(
      ({ sectionId }) => !missingSectionIds.has(sectionId),
    ),
    motionCaptures: (evidence.motionCaptures ?? []).filter((capture) => {
      const layer = layers.find(({ id }) => id === capture.layerId);
      return !layer || !missingSectionIds.has(layer.sectionId);
    }),
  });
  return {
    schemaVersion: SECTION_MANIFEST_SCHEMA_VERSION,
    manifestId: `global-shell-${role}-v1`,
    role,
    route: "*",
    family: "global-shell",
    scope: { kind: "global-shell", id: "site-shell" },
    source: {
      url: baseUrl,
      observedRoute: "/",
      motionPreference: motion,
      observedAt: new Date().toISOString(),
      status: mode === "capture" ? "captured" : "pending-capture",
      captureMode: mode,
      contentRoot: "global document shell",
      ...(diagnostics.length > 0 ? { diagnostics } : {}),
    },
    requiredViewports: records.map(({ viewport }) => viewport.name),
    tolerances: { boundsPx: 2, scrollHeightPx: 2 },
    sections: first.sections.map((section) => {
      if (missingSectionIds.has(section.id)) {
        return {
          id: section.id,
          semantic: section.semantic,
          nodeKind: "virtual",
          captureRequired: false,
          ...(section.isFooter ? { isFooter: true } : {}),
        };
      }
      return {
        ...section,
        bounds: Object.fromEntries(
          records.map((record) => [
            record.viewport.name,
            record.sections.find(({ id }) => id === section.id)?.bounds?.[
              record.viewport.name
            ] ?? {},
          ]),
        ),
      };
    }),
    viewports: Object.fromEntries(
      records.map((record) => [
        record.viewport.name,
        viewportRecord(
          record.viewport,
          record.scrollHeight,
          cleanEvidence(record.evidence),
        ),
      ]),
    ),
    motion: {
      status: allMotionEvidence ? "complete" : "incomplete",
      ...(allMotionEvidence
        ? {}
        : {
            unknown: [
              "How it works open/close interruption and reduced-motion phases require capture",
            ],
          }),
      layers,
    },
  };
}

export async function captureSectionEvidence({
  role,
  baseUrl,
  mode = "capture",
  motion = "reduce",
  route = null,
  viewport = null,
  manifestDir = DEFAULT_MANIFEST_DIR,
  artifactRoot = DEFAULT_ARTIFACT_ROOT,
  includeShell = true,
  browser = null,
} = {}) {
  const options = validateCaptureSectionOptions({
    role,
    baseUrl,
    mode,
    motion,
    route,
    viewport,
    manifestDir,
    out: artifactRoot,
  });
  const resolvedManifestDir = ensureSafePath(options.manifestDir, "manifest directory");
  const resolvedArtifactRoot = ensureSafePath(options.artifactRoot, "artifact root");
  await mkdir(resolvedManifestDir, { recursive: true });
  const selectedRoutes = options.route
    ? [routeByPath.get(options.route)]
    : routeManifest;
  const selectedViewports = options.viewport
    ? [viewportByName.get(options.viewport)]
    : viewports;
  const ownedBrowser = browser ?? (await chromium.launch({ headless: true }));
  const routeResults = [];
  const shellResults = [];
  try {
    for (const selectedViewport of selectedViewports) {
      const context = await ownedBrowser.newContext({
        viewport: { width: selectedViewport.width, height: selectedViewport.height },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: options.motion,
      });
      if (options.role === "reference") {
        await context.addCookies([
          {
            name: "consentChoice",
            value: "rejected",
            domain: new URL(options.baseUrl).hostname,
            path: "/",
            secure: new URL(options.baseUrl).protocol === "https:",
            sameSite: "Lax",
          },
        ]);
      }
      for (const selectedRoute of selectedRoutes) {
        // Use a fresh page for every route. The reference app has long-lived
        // media/animation resources and reusing one page across all 30 paths
        // can close the page after a sufficiently large route crawl.
        const page = await context.newPage();
        try {
          routeResults.push(
            await captureRouteViewport({
              page,
              route: selectedRoute,
              viewport: selectedViewport,
              role: options.role,
              baseUrl: options.baseUrl,
              mode: options.mode,
              motion: options.motion,
              manifestDir: resolvedManifestDir,
              artifactRoot: resolvedArtifactRoot,
            }),
          );
        } finally {
          await page.close().catch(() => {});
        }
      }
      if (includeShell && (!options.route || options.route === "/")) {
        const shellPage = await context.newPage();
        const shellDiagnostics = installPageDiagnostics(shellPage);
        await shellPage.goto(new URL("/", options.baseUrl).href, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        await waitForVisualReadiness(shellPage, {
          waitForImages: options.mode === "capture",
        });
        if (options.role === "implementation") {
          assertPageDiagnostics(shellDiagnostics, `${options.role} global shell`);
        }
        const shellRecord = await inspectShell(
          shellPage,
          selectedViewport,
          options.role,
          resolvedManifestDir,
          resolvedArtifactRoot,
          options.mode,
          options.motion,
        );
        // Shell interactions and screenshots can emit diagnostics after the
        // initial readiness boundary, so enforce the implementation policy at
        // the end of the shell capture as well.
        if (options.role === "implementation") {
          assertPageDiagnostics(shellDiagnostics, `${options.role} global shell`);
        }
        shellResults.push({
          ...shellRecord,
          diagnostics: recordedDiagnostics(shellDiagnostics),
        });
        await shellPage.close().catch(() => {});
      }
      await context.close();
    }
  } finally {
    if (!browser) await ownedBrowser.close();
  }

  const routeManifests = [];
  for (const selectedRoute of selectedRoutes) {
    const records = routeResults.filter(({ route }) => route === selectedRoute.path);
    if (records.length === 0) continue;
    const manifestValue = combineRouteRecords({
      route: selectedRoute,
      role: options.role,
      baseUrl: options.baseUrl,
      sourceRecords: records,
      manifestDir: resolvedManifestDir,
      mode: options.mode,
      motion: options.motion,
    });
    const outputPath = path.join(
      resolvedManifestDir,
      manifestFilename(selectedRoute, options.role),
    );
    await writeFile(outputPath, `${JSON.stringify(manifestValue, null, 2)}\n`);
    routeManifests.push({
      route: selectedRoute.path,
      path: outputPath,
      manifest: manifestValue,
    });
  }
  let shellPath = null;
  if (shellResults.length > 0) {
    const shellManifest = combineShellRecords({
      role: options.role,
      baseUrl: options.baseUrl,
      records: shellResults,
      manifestDir: resolvedManifestDir,
      mode: options.mode,
      motion: options.motion,
    });
    shellPath = path.join(resolvedManifestDir, `global-shell-${options.role}.json`);
    await writeFile(shellPath, `${JSON.stringify(shellManifest, null, 2)}\n`);
  }
  return {
    role: options.role,
    mode: options.mode,
    baseUrl: options.baseUrl,
    routeCount: routeManifests.length,
    routes: routeManifests,
    shell: shellPath,
  };
}

function usage() {
  return `Usage:
  node scripts/fidelity/capture-section-evidence.mjs --role=reference --base-url=https://white-desert.com [options]
  node scripts/fidelity/capture-section-evidence.mjs --role=implementation --base-url=http://127.0.0.1:4173 [options]

Options:
  --mode=capture|manifest-only   capture evidence or only record live measurements (default: capture)
  --motion=reduce|no-preference  browser motion preference (default: reduce)
  --route=/path                  capture one route (default: all route authority paths)
  --viewport=desktop|tablet|mobile
  --manifest-dir=path            manifest output directory
  --out=path                     artifact output root
  --help`;
}

export async function runCaptureSectionEvidenceCli(
  argv = process.argv.slice(2),
  { stdout = process.stdout } = {},
) {
  const args = parseCaptureSectionArguments(argv);
  if (args.help === true) {
    stdout.write(`${usage()}\n`);
    return { status: "help", accepted: true };
  }
  const options = validateCaptureSectionOptions({
    role: args.role,
    baseUrl: args["base-url"],
    mode: args.mode,
    motion: args.motion,
    route: args.route,
    viewport: args.viewport,
    manifestDir: args["manifest-dir"],
    out: args.out,
  });
  const result = await captureSectionEvidence(options);
  stdout.write(
    `${JSON.stringify(
      {
        status: result.mode === "capture" ? "captured" : "measured",
        accepted: true,
        role: result.role,
        mode: result.mode,
        routeCount: result.routeCount,
        shell: result.shell,
        manifests: result.routes.map(({ route, path: manifestPath }) => ({
          route,
          path: manifestPath,
        })),
      },
      null,
      2,
    )}\n`,
  );
  return result;
}

const modulePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === modulePath) {
  runCaptureSectionEvidenceCli().catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${reason}\n`);
    process.exitCode = 1;
  });
}
