import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";

import {
  renderedRoutes,
  routeRedirects,
  type RoutePath,
} from "../../src/content/route-manifest";

/**
 * Release evidence is deliberately separate from implementation-authored
 * visual regression. These files are deterministic local state evidence and
 * are never read from, or written to, the target website.
 */
const ARTIFACT_ROOT = resolve(process.cwd(), "artifacts/reference/actual-states");
const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:4173";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

type ViewportConfig = (typeof viewports)[number];
type MotionPreference = "no-preference" | "reduce";

const motionRoutes = [
  "/",
  "/antarctica/fuel-depot",
] as const satisfies readonly RoutePath[];

const requiredLandmarkPatterns = [
  { label: "hero", pattern: /hero/i },
  { label: "content", pattern: /content|section|primary/i },
  { label: "footer", pattern: /footer/i },
] as const;

interface NetworkObservation {
  readonly externalRequests: string[];
  readonly submissionRequests: string[];
}

interface ReadinessSnapshot {
  readonly fontReady: boolean;
  readonly fontStatus: string;
  readonly images: {
    readonly total: number;
    readonly complete: number;
    readonly loaded: number;
    readonly failed: number;
    readonly allComplete: boolean;
  };
}

interface LandmarkSnapshot {
  readonly value: string;
  readonly name: string;
  readonly visible: boolean;
  readonly geometry: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

interface MotionEntry {
  readonly target: string;
  readonly durationMs: number;
  readonly iterations: number | "infinite";
  readonly playState: string;
  readonly hasTransform: boolean;
}

interface MotionSnapshot {
  readonly activeLongAnimations: readonly MotionEntry[];
  readonly activeInfiniteAnimations: readonly MotionEntry[];
  readonly activeTransformAnimations: readonly MotionEntry[];
  readonly longCssAnimations: readonly string[];
  readonly longCssTransitions: readonly string[];
  readonly reducedMotion: boolean;
  readonly scrollBehavior: string;
}

interface PageSnapshot {
  readonly scrollY: number;
  readonly scrollHeight: number;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
  };
  readonly locale: string;
  readonly timezone: string;
  readonly reducedMotion: boolean;
  readonly canonical: string | null;
  readonly readiness: ReadinessSnapshot;
  readonly landmarks: readonly LandmarkSnapshot[];
}

interface StateRecord {
  readonly route: string;
  readonly family: string;
  readonly state: string;
  readonly viewport: ViewportConfig;
  readonly requestedUrl: string;
  readonly responseStatus: number | null;
  readonly redirectChain: readonly string[];
  readonly location: string | null;
  readonly finalUrl: string;
  readonly canonical: string | null;
  readonly scrollY: number;
  readonly scrollHeight: number;
  readonly fontReady: boolean;
  readonly imageReady: boolean;
  readonly fontReadiness: {
    readonly status: string;
    readonly ready: boolean;
  };
  readonly imageReadiness: ReadinessSnapshot["images"];
  readonly browser: {
    readonly name: string;
    readonly version: string;
    readonly userAgent: string;
    readonly locale: string;
    readonly timezone: string;
    readonly devicePixelRatio: number;
  };
  readonly reducedMotion: MotionPreference;
  readonly landmarks: readonly LandmarkSnapshot[];
  readonly motion: MotionSnapshot;
  readonly screenshotPath: string;
  readonly screenshotHash: string;
}

interface CapturedStateOptions {
  readonly page: Page;
  readonly route: string;
  readonly family: string;
  readonly state: string;
  readonly viewport: ViewportConfig;
  readonly requestedUrl: string;
  readonly response: Response | null;
  readonly reducedMotion: MotionPreference;
}

function routeSlug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "--");
}

function artifactPath(
  route: string,
  state: string,
  viewport: ViewportConfig,
  extension: "png" | "json",
): string {
  return join(
    ARTIFACT_ROOT,
    routeSlug(route),
    `${state}-${viewport.name}.${extension}`,
  );
}

function relativeArtifactPath(filePath: string): string {
  return relative(process.cwd(), filePath).replaceAll("\\", "/");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function installLocalOnlyGuard(
  page: Page,
  localOrigin: string,
): Promise<NetworkObservation> {
  const externalRequests: string[] = [];
  const submissionRequests: string[] = [];

  page.on("request", (request) => {
    if (request.isNavigationRequest() || request.method() !== "GET") {
      submissionRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  return page
    .route("**/*", async (route) => {
      const requestUrl = route.request().url();
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(requestUrl);
      } catch {
        externalRequests.push(requestUrl);
        await route.abort();
        return;
      }

      if (!parsedUrl.protocol.startsWith("http")) {
        await route.continue();
        return;
      }

      if (parsedUrl.origin !== localOrigin) {
        externalRequests.push(requestUrl);
        await route.abort();
        return;
      }

      await route.continue();
    })
    .then(() => ({ externalRequests, submissionRequests }));
}

async function waitForStableFrame(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolvePromise) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolvePromise());
        });
      }),
  );
}

async function waitForReadiness(page: Page): Promise<void> {
  await Promise.race([
    page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
    }),
    new Promise<void>((resolvePromise) => {
      setTimeout(resolvePromise, 1500);
    }),
  ]);

  await page
    .waitForFunction(
      () =>
        Array.from(document.images)
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          })
          .every((image) => image.complete),
      undefined,
      { timeout: 1500 },
    )
    .catch(() => undefined);

  await waitForStableFrame(page);
}

async function openLocalRoute(
  page: Page,
  route: string,
  localOrigin: string,
): Promise<{ requestedUrl: string; response: Response }> {
  const requestedUrl = new URL(route, localOrigin).toString();
  const response = await page.goto(requestedUrl, {
    waitUntil: "domcontentloaded",
  });

  if (!response) {
    throw new Error(`No response received for local route ${route}`);
  }

  await waitForReadiness(page);
  return { requestedUrl, response };
}

function redirectChain(response: Response | null): readonly string[] {
  const chain: string[] = [];
  let request: Request | null | undefined = response?.request();

  while (request) {
    chain.unshift(request.url());
    request = request.redirectedFrom();
  }

  return chain;
}

async function readPageSnapshot(page: Page): Promise<PageSnapshot> {
  return page.evaluate(() => {
    const images = Array.from(document.images);
    const landmarks = Array.from(
      document.querySelectorAll<HTMLElement>("[data-fidelity-landmark]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const value = element.getAttribute("data-fidelity-landmark") ?? "";
      const labelledBy = element.getAttribute("aria-labelledby");
      const labelledText = labelledBy
        ? labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? "")
            .join(" ")
        : "";
      const headingText = element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent;
      const name = (
        element.getAttribute("aria-label") ??
        labelledText ??
        headingText ??
        element.textContent ??
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);

      return {
        value,
        name,
        visible:
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0,
        geometry: {
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        },
      };
    });

    return {
      scrollY: Math.round(window.scrollY),
      scrollHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      ),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      canonical:
        document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
      readiness: {
        fontReady: document.fonts?.status === "loaded",
        fontStatus: document.fonts?.status ?? "unsupported",
        images: {
          total: images.length,
          complete: images.filter((image) => image.complete).length,
          loaded: images.filter((image) => image.complete && image.naturalWidth > 0)
            .length,
          failed: images.filter((image) => image.complete && image.naturalWidth === 0)
            .length,
          allComplete: images.every((image) => image.complete),
        },
      },
      landmarks,
    };
  });
}

async function readMotionSnapshot(page: Page): Promise<MotionSnapshot> {
  return page.evaluate(() => {
    const parseDuration = (value: string): number => {
      const trimmed = value.trim();
      if (trimmed.endsWith("ms")) {
        return Number.parseFloat(trimmed);
      }
      if (trimmed.endsWith("s")) {
        return Number.parseFloat(trimmed) * 1000;
      }
      return 0;
    };

    const motionEntry = (animation: Animation): MotionEntry => {
      const effect = animation.effect;
      const timing = effect?.getComputedTiming();
      const duration = typeof timing?.duration === "number" ? timing.duration : 0;
      const iterations =
        timing?.iterations === Infinity ? "infinite" : (timing?.iterations ?? 1);
      const target =
        effect instanceof KeyframeEffect && effect.target instanceof Element
          ? (effect.target.getAttribute("data-fidelity-landmark") ??
            effect.target.tagName.toLowerCase())
          : "document";
      const hasTransform =
        effect instanceof KeyframeEffect &&
        effect.getKeyframes().some((frame) => "transform" in frame);

      return {
        target,
        durationMs: duration,
        iterations,
        playState: animation.playState,
        hasTransform,
      };
    };

    const runningAnimations = document
      .getAnimations()
      .filter((animation) => animation.playState === "running")
      .map(motionEntry);
    const activeLongAnimations = runningAnimations.filter(
      (animation) => animation.durationMs > 50,
    );
    const activeInfiniteAnimations = runningAnimations.filter(
      (animation) => animation.iterations === "infinite",
    );
    const activeTransformAnimations = runningAnimations.filter(
      (animation) => animation.hasTransform,
    );
    const longCssAnimations: string[] = [];
    const longCssTransitions: string[] = [];

    for (const element of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const style = getComputedStyle(element);
      const animationNames = style.animationName.split(",");
      const animationDurations = style.animationDuration.split(",");
      if (
        animationNames.some(
          (name, index) =>
            name.trim() !== "none" &&
            parseDuration(animationDurations[index] ?? animationDurations[0] ?? "0s") >
              50,
        )
      ) {
        longCssAnimations.push(
          element.getAttribute("data-fidelity-landmark") ??
            element.tagName.toLowerCase(),
        );
      }

      const transitionDurations = style.transitionDuration.split(",");
      if (transitionDurations.some((duration) => parseDuration(duration) > 50)) {
        longCssTransitions.push(
          element.getAttribute("data-fidelity-landmark") ??
            element.tagName.toLowerCase(),
        );
      }
    }

    return {
      activeLongAnimations,
      activeInfiniteAnimations,
      activeTransformAnimations,
      longCssAnimations,
      longCssTransitions,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
}

async function captureState(options: CapturedStateOptions): Promise<StateRecord> {
  const { page, route, family, state, viewport, requestedUrl, response } = options;
  await waitForStableFrame(page);

  const screenshotFile = artifactPath(route, state, viewport, "png");
  await mkdir(dirname(screenshotFile), { recursive: true });
  const screenshot = await page.screenshot({
    path: screenshotFile,
    animations: "disabled",
    caret: "hide",
  });
  const [snapshot, motion] = await Promise.all([
    readPageSnapshot(page),
    readMotionSnapshot(page),
  ]);
  const browser = page.context().browser();
  const browserName = browser?.browserType().name() ?? "unknown";
  const browserVersion = browser?.version() ?? "unknown";
  const screenshotHash = createHash("sha256").update(screenshot).digest("hex");
  const record: StateRecord = {
    route,
    family,
    state,
    viewport,
    requestedUrl,
    responseStatus: response?.status() ?? null,
    redirectChain: redirectChain(response),
    location: response?.headers().location ?? null,
    finalUrl: page.url(),
    canonical: snapshot.canonical,
    scrollY: snapshot.scrollY,
    scrollHeight: snapshot.scrollHeight,
    fontReady: snapshot.readiness.fontReady,
    imageReady:
      snapshot.readiness.images.total === 0 ||
      snapshot.readiness.images.loaded === snapshot.readiness.images.total,
    fontReadiness: {
      status: snapshot.readiness.fontStatus,
      ready: snapshot.readiness.fontReady,
    },
    imageReadiness: snapshot.readiness.images,
    browser: {
      name: browserName,
      version: browserVersion,
      userAgent: await page.evaluate(() => navigator.userAgent),
      locale: snapshot.locale,
      timezone: snapshot.timezone,
      devicePixelRatio: snapshot.viewport.devicePixelRatio,
    },
    reducedMotion: options.reducedMotion,
    landmarks: snapshot.landmarks,
    motion,
    screenshotPath: relativeArtifactPath(screenshotFile),
    screenshotHash,
  };

  await writeJson(artifactPath(route, state, viewport, "json"), record);
  return record;
}

async function firstVisible(locator: Locator): Promise<Locator> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible()) {
      return candidate;
    }
  }

  throw new Error("Expected a visible locator, but none was found");
}

async function hasVisible(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    if (await locator.nth(index).isVisible()) {
      return true;
    }
  }
  return false;
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ),
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertRequiredLandmarks(page: Page): Promise<void> {
  const landmarks = page.locator("[data-fidelity-landmark]");
  const count = await landmarks.count();
  expect(count).toBeGreaterThanOrEqual(requiredLandmarkPatterns.length);

  const values = await landmarks.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-fidelity-landmark") ?? ""),
  );

  for (const requirement of requiredLandmarkPatterns) {
    const index = values.findIndex((value) => requirement.pattern.test(value));
    expect(
      index,
      `missing ${requirement.label} data-fidelity landmark`,
    ).toBeGreaterThanOrEqual(0);
    await expect(landmarks.nth(index)).toBeVisible();
  }
}

async function assertCommonRouteContract(page: Page): Promise<Locator> {
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const navigation = await firstVisible(page.getByRole("navigation"));
  await expect(navigation).toBeVisible();
  await assertRequiredLandmarks(page);
  await assertNoHorizontalOverflow(page);

  return findMenuTrigger(page);
}

async function findMenuTrigger(page: Page): Promise<Locator> {
  const candidates = page.locator("button[aria-expanded][aria-controls]");
  const count = await candidates.count();
  let firstVisibleCandidate: Locator | null = null;

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible()) || !(await candidate.isEnabled())) {
      continue;
    }

    firstVisibleCandidate ??= candidate;
    const label = (
      (await candidate.getAttribute("aria-label")) ?? (await candidate.innerText())
    ).toLowerCase();
    const controls =
      (await candidate.getAttribute("aria-controls"))?.toLowerCase() ?? "";
    if (/menu|navigation|experience|operation|about/.test(`${label} ${controls}`)) {
      return candidate;
    }
  }

  if (firstVisibleCandidate) {
    return firstVisibleCandidate;
  }

  return firstVisible(page.getByRole("button", { name: /menu/i }));
}

function escapedAttributeValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

async function menuPanelFor(page: Page, trigger: Locator): Promise<Locator> {
  const controls = await trigger.getAttribute("aria-controls");
  if (controls) {
    const controlledPanel = page.locator(`[id="${escapedAttributeValue(controls)}"]`);
    if ((await controlledPanel.count()) > 0) {
      return controlledPanel.first();
    }
  }

  const roleCandidates = [
    page.getByRole("dialog", { name: /menu|navigation/i }),
    page.getByRole("menu", { name: /menu|navigation/i }),
    page.getByRole("navigation", { name: /menu|navigation/i }),
  ];
  for (const candidate of roleCandidates) {
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  throw new Error("The menu trigger did not expose an accessible controlled panel");
}

function menuFocusableElements(menu: Locator): Locator {
  return menu.locator(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
}

async function assertMenuOpenContract(page: Page, trigger: Locator): Promise<Locator> {
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", /.+/);
  await trigger.focus();
  await trigger.click();

  const menu = await menuPanelFor(page, trigger);
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAccessibleName(/menu|navigation/i);

  const role = await menu.getAttribute("role");
  if (role === "dialog") {
    await expect(menu).toHaveAttribute("aria-modal", "true");
  }

  const focusables = menuFocusableElements(menu);
  const focusableCount = await focusables.count();
  expect(focusableCount).toBeGreaterThan(0);
  await focusables.first().focus();
  for (let index = 0; index < Math.min(focusableCount + 1, 6); index += 1) {
    await page.keyboard.press("Tab");
    expect(
      await menu.evaluate((element) => element.contains(document.activeElement)),
      "menu focus must remain contained while it is open",
    ).toBe(true);
  }

  return menu;
}

async function assertMenuClosedAndRestored(
  page: Page,
  menu: Locator,
  trigger: Locator,
): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
}

async function fillFormControls(form: Locator): Promise<void> {
  const controls = form.locator("input, textarea, select");
  const count = await controls.count();
  const radioGroups = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible()) || !(await control.isEnabled())) {
      continue;
    }

    const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
    if (tagName === "select") {
      const options = await control
        .locator("option:not([disabled])")
        .evaluateAll((elements) =>
          elements.map((element) => ({
            value: (element as HTMLOptionElement).value,
            text: element.textContent?.trim() ?? "",
          })),
        );
      const option =
        options.find((candidate) => candidate.value) ??
        options.find((candidate) => candidate.text);
      if (option) {
        await control.selectOption({ value: option.value });
      }
      continue;
    }

    const inputType = ((await control.getAttribute("type")) ?? "text").toLowerCase();
    if (inputType === "checkbox") {
      if (!(await control.isChecked())) {
        await control.check();
      }
      continue;
    }
    if (inputType === "radio") {
      const group = (await control.getAttribute("name")) ?? `radio-${index}`;
      if (!radioGroups.has(group)) {
        await control.check();
        radioGroups.add(group);
      }
      continue;
    }
    if (["file", "hidden", "submit", "button", "reset"].includes(inputType)) {
      continue;
    }

    const valueByType: Record<string, string> = {
      date: "2030-01-01",
      "datetime-local": "2030-01-01T12:00",
      email: "release@example.test",
      month: "2030-01",
      number: "1",
      tel: "0000000000",
      time: "12:00",
      url: "https://example.test/",
    };
    await control.fill(valueByType[inputType] ?? "Release harness fixture");
  }
}

async function makeFormInvalid(form: Locator): Promise<void> {
  const controls = form.locator("input, textarea");
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (
      (await control.isVisible()) &&
      (await control.isEnabled()) &&
      (await control.getAttribute("type")) === "email"
    ) {
      await control.fill("not-an-email");
      return;
    }
  }

  const required = form.locator("[required]");
  const requiredCount = await required.count();
  for (let index = 0; index < requiredCount; index += 1) {
    const control = required.nth(index);
    const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
    const inputType = (await control.getAttribute("type"))?.toLowerCase();
    if (!(await control.isVisible()) || !(await control.isEnabled())) {
      continue;
    }
    if (inputType === "checkbox" || inputType === "radio") {
      await control.uncheck();
    } else if (tagName === "input" || tagName === "textarea") {
      await control.fill("");
    } else {
      continue;
    }
    return;
  }

  const firstTextbox = form.getByRole("textbox").first();
  if ((await firstTextbox.count()) > 0) {
    await firstTextbox.fill("");
  }
}

async function findSubmitButton(form: Locator): Promise<Locator> {
  const buttons = form.getByRole("button");
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible())) {
      continue;
    }
    const type = (await button.getAttribute("type"))?.toLowerCase();
    const name = (await button.innerText()).toLowerCase();
    if (type === "submit" || /submit|send|enquir|request/.test(name)) {
      return button;
    }
  }

  const inputSubmit = form.locator('input[type="submit"]');
  return firstVisible(inputSubmit);
}

function routeFamily(path: RoutePath): string {
  const route = renderedRoutes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`Expected rendered route in the manifest: ${path}`);
  }
  return route.family;
}

test.use({ screenshot: "off", trace: "off", video: "off" });

test.describe("release coverage: rendered routes", () => {
  for (const route of renderedRoutes) {
    for (const viewport of viewports) {
      test(`${route.path} (${route.family}) renders at ${viewport.name}`, async ({
        page,
        baseURL,
      }) => {
        const localOrigin = new URL(baseURL ?? DEFAULT_LOCAL_BASE_URL).origin;
        const network = await installLocalOnlyGuard(page, localOrigin);
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const { requestedUrl, response } = await openLocalRoute(
          page,
          route.path,
          localOrigin,
        );

        expect(response.status()).toBe(200);
        const menuTrigger = await assertCommonRouteContract(page);
        await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
        await expect(menuTrigger).toHaveAttribute("aria-controls", /.+/);

        await captureState({
          page,
          route: route.path,
          family: route.family,
          state: "default",
          viewport,
          requestedUrl,
          response,
          reducedMotion: "no-preference",
        });

        expect(network.externalRequests).toEqual([]);
      });
    }
  }
});

test.describe("release coverage: Antarctica redirect", () => {
  test("/antarctica returns a 307 and the documented Location at every viewport", async ({
    page,
    request,
    baseURL,
  }) => {
    const localOrigin = new URL(baseURL ?? DEFAULT_LOCAL_BASE_URL).origin;
    const network = await installLocalOnlyGuard(page, localOrigin);
    const destination = routeRedirects[0]?.to;
    if (!destination) {
      throw new Error("The route manifest must define the /antarctica redirect");
    }
    const records: Array<Record<string, unknown>> = [];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });

      const requestedUrl = new URL("/antarctica", localOrigin).toString();
      const initial = await request.get(requestedUrl, { maxRedirects: 0 });
      const location = initial.headers().location ?? null;
      expect(initial.status()).toBe(307);
      expect(location).toBe(destination);

      const finalResponse = await page.goto(requestedUrl, {
        waitUntil: "domcontentloaded",
      });
      if (!finalResponse) {
        throw new Error("The redirect did not produce a final local response");
      }
      await waitForReadiness(page);
      expect(finalResponse.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe(destination);

      const snapshot = await readPageSnapshot(page);
      records.push({
        route: "/antarctica",
        family: "region-index-redirect",
        state: "redirect",
        viewport,
        requestedUrl,
        responseStatus: initial.status(),
        location,
        redirectChain: redirectChain(finalResponse),
        finalResponseStatus: finalResponse.status(),
        finalUrl: page.url(),
        canonical: snapshot.canonical,
        scrollY: snapshot.scrollY,
        scrollHeight: snapshot.scrollHeight,
        fontReadiness: snapshot.readiness,
        browser: {
          name: page.context().browser()?.browserType().name() ?? "unknown",
          version: page.context().browser()?.version() ?? "unknown",
          userAgent: await page.evaluate(() => navigator.userAgent),
          locale: snapshot.locale,
          timezone: snapshot.timezone,
          devicePixelRatio: snapshot.viewport.devicePixelRatio,
        },
        reducedMotion: "no-preference",
        landmarks: snapshot.landmarks,
        screenshotHash: null,
      });
    }

    await writeJson(join(ARTIFACT_ROOT, "redirect", "actual.json"), {
      route: "/antarctica",
      expectedStatus: 307,
      expectedLocation: destination,
      viewports: records,
    });
    expect(network.externalRequests).toEqual([]);
  });
});

const representativeRoutes = Array.from(
  new Map(renderedRoutes.map((route) => [route.family, route])).values(),
);

test.describe("release coverage: representative menu states", () => {
  for (const route of representativeRoutes) {
    for (const viewport of viewports) {
      test(`${route.path} menu is accessible at ${viewport.name}`, async ({
        page,
        baseURL,
      }) => {
        const localOrigin = new URL(baseURL ?? DEFAULT_LOCAL_BASE_URL).origin;
        const network = await installLocalOnlyGuard(page, localOrigin);
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const { requestedUrl, response } = await openLocalRoute(
          page,
          route.path,
          localOrigin,
        );
        expect(response.status()).toBe(200);
        const trigger = await assertCommonRouteContract(page);

        await page.evaluate(() => window.scrollTo(0, 0));
        const menu = await assertMenuOpenContract(page, trigger);
        if (route.path === "/") {
          const scrollable = await page.evaluate(
            () => document.documentElement.scrollHeight > window.innerHeight + 1,
          );
          expect(scrollable).toBe(true);
          await page.mouse.wheel(0, Math.max(200, viewport.height / 2));
          await waitForStableFrame(page);
          expect(await page.evaluate(() => window.scrollY)).toBe(0);
        }

        await captureState({
          page,
          route: route.path,
          family: route.family,
          state: "menu-open",
          viewport,
          requestedUrl,
          response,
          reducedMotion: "no-preference",
        });

        await assertMenuClosedAndRestored(page, menu, trigger);
        const reopenedMenu = await assertMenuOpenContract(page, trigger);
        const closeButton = reopenedMenu.getByRole("button", { name: /close/i });
        if (await hasVisible(closeButton)) {
          await closeButton.first().click();
        } else {
          await trigger.click();
        }
        await expect(reopenedMenu).toBeHidden();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(trigger).toBeFocused();

        await captureState({
          page,
          route: route.path,
          family: route.family,
          state: "menu-closed",
          viewport,
          requestedUrl,
          response,
          reducedMotion: "no-preference",
        });

        expect(network.externalRequests).toEqual([]);
      });
    }
  }
});

test.describe("release coverage: local-only enquiry form", () => {
  for (const viewport of viewports) {
    test(`/enquire form states at ${viewport.name}`, async ({ page, baseURL }) => {
      const localOrigin = new URL(baseURL ?? DEFAULT_LOCAL_BASE_URL).origin;
      const network = await installLocalOnlyGuard(page, localOrigin);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const { requestedUrl, response } = await openLocalRoute(
        page,
        "/enquire",
        localOrigin,
      );
      expect(response.status()).toBe(200);
      await assertCommonRouteContract(page);

      const forms = page.locator("form");
      await expect(forms).toHaveCount(1);
      const form = forms.first();
      const submit = await findSubmitButton(form);

      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-pristine",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });

      const firstField = form.getByRole("textbox").first();
      if ((await firstField.count()) > 0) {
        await firstField.focus();
      } else {
        await form.getByRole("combobox").first().focus();
      }
      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-focused",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });

      await fillFormControls(form);
      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-filled",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });

      await makeFormInvalid(form);
      await expect(submit).toBeEnabled();
      const beforeInvalidSubmit = network.submissionRequests.length;
      await submit.click();
      await waitForStableFrame(page);
      expect(network.submissionRequests.slice(beforeInvalidSubmit)).toEqual([]);
      expect(page.url()).toBe(requestedUrl);
      const visibleInvalidFields = await hasVisible(
        form.locator('[aria-invalid="true"]'),
      );
      const visibleAlerts = await hasVisible(page.getByRole("alert"));
      expect(visibleInvalidFields || visibleAlerts).toBe(true);
      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-invalid",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });

      await fillFormControls(form);
      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-valid",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });

      const beforeBlockedSubmit = network.submissionRequests.length;
      await submit.click();
      await waitForStableFrame(page);
      expect(network.submissionRequests.slice(beforeBlockedSubmit)).toEqual([]);
      expect(network.externalRequests).toEqual([]);
      expect(page.url()).toBe(requestedUrl);
      const visibleStatus =
        (await hasVisible(page.getByRole("status"))) ||
        (await hasVisible(page.getByRole("alert")));
      expect(visibleStatus).toBe(true);
      await captureState({
        page,
        route: "/enquire",
        family: "enquiry-form",
        state: "form-blocked-submit",
        viewport,
        requestedUrl,
        response,
        reducedMotion: "no-preference",
      });
    });
  }
});

test.describe("release coverage: motion preferences", () => {
  for (const route of motionRoutes) {
    for (const viewport of viewports) {
      for (const reducedMotion of ["no-preference", "reduce"] as const) {
        test(`${route} remains usable with ${reducedMotion} at ${viewport.name}`, async ({
          page,
          baseURL,
        }) => {
          const localOrigin = new URL(baseURL ?? DEFAULT_LOCAL_BASE_URL).origin;
          const network = await installLocalOnlyGuard(page, localOrigin);
          await page.setViewportSize(viewport);
          await page.emulateMedia({ reducedMotion });
          const { requestedUrl, response } = await openLocalRoute(
            page,
            route,
            localOrigin,
          );
          expect(response.status()).toBe(200);
          await assertCommonRouteContract(page);
          await expect(page.locator("main")).toBeVisible();
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          expect((await page.locator("main").innerText()).trim()).not.toBe("");
          expect(
            await page.evaluate(
              () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            ),
          ).toBe(reducedMotion === "reduce");

          await page.evaluate(() => window.scrollTo(0, 0));
          const scrollable = await page.evaluate(
            () => document.documentElement.scrollHeight > window.innerHeight + 1,
          );
          if (scrollable) {
            await page.mouse.wheel(0, Math.max(200, viewport.height / 2));
            await waitForStableFrame(page);
            expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
          }

          const motion = await readMotionSnapshot(page);
          if (reducedMotion === "reduce") {
            expect(motion.activeLongAnimations).toEqual([]);
            expect(motion.activeInfiniteAnimations).toEqual([]);
            expect(motion.activeTransformAnimations).toEqual([]);
            expect(motion.longCssAnimations).toEqual([]);
            expect(motion.longCssTransitions).toEqual([]);
            expect(motion.scrollBehavior).toBe("auto");
          }

          await page.evaluate(() => window.scrollTo(0, 0));
          await captureState({
            page,
            route,
            family: routeFamily(route),
            state: `motion-${reducedMotion}`,
            viewport,
            requestedUrl,
            response,
            reducedMotion,
          });
          expect(network.externalRequests).toEqual([]);
        });
      }
    }
  }
});
