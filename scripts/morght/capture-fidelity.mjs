import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const role = process.argv.includes("--reference") ? "reference" : "actual";
const introOnly = process.argv.includes("--intro-only");
const out = role === "reference" ? "references/morght/final" : "artifacts/morght/final";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const ids = ["intro", "mission", "service", "career", "news", "company"];
const local = process.env.MORGHT_URL || "http://127.0.0.1:3002";
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  if (process.env.MORGHT_WIDTH && Number(process.env.MORGHT_WIDTH) !== width) continue;
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (role === "reference")
    await page.route("**/*-deco.png", async (route) => {
      const name = new URL(route.request().url()).pathname
        .split("/")
        .at(-1)
        .replace(".png", "-still.webp");
      await route.fulfill({
        body: await readFile(`public/media/morght/${name}`),
        contentType: "image/webp",
      });
    });
  const response = await page.goto(
    role === "reference" ? "https://morght.com/" : local + "/about",
    { waitUntil: "networkidle" },
  );
  if (role === "actual") await page.waitForSelector('[data-ready="true"]');
  else await page.waitForSelector(".c-home-intro__logoType-type.-show");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => {
        i.loading = "eager";
        return i.decode().catch(() => {});
      }),
    );
  });
  await page.waitForTimeout(4500);
  if (role === "actual") {
    await page.locator(".mg-pause").evaluate((e) => e.click());
    await page.waitForSelector('[data-paused="true"]');
    await page.evaluate(async () =>
      Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
    );
  }
  const root = role === "reference" ? "main" : ".mg-main";
  const footer = role === "reference" ? "footer" : ".mg-footer";
  const columns =
    role === "reference" ? ".c-home-carousel__item" : ".mg-carousel-column";
  const normalization = await page.locator(columns).evaluateAll((els, selector) => {
    let x = innerWidth * 0.32;
    const total = els.reduce((n, e) => n + e.clientWidth, 0);
    return els
      .map((e, i) => {
        const left = x > innerWidth ? x - total : x;
        x += e.clientWidth;
        return `${selector}:nth-child(${i + 1}){transform:translate3d(${left}px,0,0)!important}`;
      })
      .join("\n");
  }, columns);
  await page.addStyleTag({
    content:
      normalization +
      "\n.mg-pause{visibility:hidden!important}nextjs-portal{display:none!important}.c-home-circle__text svg,.mg-circle-ring svg{animation:none!important;transform:none!important}",
  });
  await page.evaluate(() => {
    for (const e of document.querySelectorAll(".c-clock__date,[data-date]"))
      e.textContent = "2026.09.09";
    for (const e of document.querySelectorAll(".c-clock__time,[data-time]"))
      e.textContent = "09:31 PM";
  });
  await page.mouse.move(0, 0);
  const sections = await page.locator(`${root}>section,${footer}`).evaluateAll(
    (els, ids) =>
      els.map((e, i) => {
        const box = (n) => {
          const r = n.getBoundingClientRect();
          return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        return {
          id: ids[i] || "footer",
          kind: "element",
          parent: i === 6 ? "global-shell" : "route-content",
          order: i,
          tag: e.tagName,
          heading:
            e.querySelector("h2")?.textContent.trim() ||
            (i === 0 ? "Morght" : "Footer"),
          bounds: box(e),
          items: e.querySelectorAll("li").length,
          headings: [...e.querySelectorAll("h1,h2")].map((n) => n.textContent.trim()),
          assets: [...e.querySelectorAll("img")].map((n) =>
            n.src
              .split("/")
              .at(-1)
              .replace("-still.webp", ".png")
              .replace(".jpg", ".webp"),
          ),
          links: [...e.querySelectorAll("a[href]")].map((n) => ({
            text: n.textContent.trim().replace(/\s+/g, " "),
            href: n.getAttribute("href"),
          })),
          children: [...e.children].map((n) => n.tagName),
        };
      }),
    ids,
  );
  const meta = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  const source = {
    schemaVersion: 1,
    role,
    route: role === "reference" ? "/" : "/about",
    scope: "route-content",
    sourceUrl: page.url(),
    status: response.status(),
    observedAt: new Date().toISOString(),
    ...meta,
    scaleX: 1,
    scaleY: 1,
    contentRoot: root,
    directChildren: sections.slice(0, 6).map((s) => s.id),
    sections: sections.slice(0, 6),
    shell: { id: "global-shell", sections: [sections[6]] },
    artifacts: [],
    motion: [],
  };
  const scroll = async (y) => {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(1650);
  };
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => {
      for (const e of document.querySelectorAll(".c-clock__date,[data-date]"))
        e.textContent = "2026.09.09";
      for (const e of document.querySelectorAll(".c-clock__time,[data-time]"))
        e.textContent = "09:31 PM";
    });
    const path = `${out}/${width}-${name}.png`;
    await page.screenshot({ path, fullPage, timeout: 30000 });
    console.log(role, width, name);
    source.artifacts.push({
      name,
      path,
      scrollY: await page.evaluate(() => scrollY),
      fullPage,
    });
    return path;
  };
  await scroll(0);
  await shot("top");
  const reference =
    role === "actual"
      ? JSON.parse(await readFile(`references/morght/final/${width}.json`, "utf8"))
      : source;
  for (let i = 0; i < sections.length; i++) {
    if (introOnly && i !== 0) continue;
    const s = sections[i];
    const ref = i === 6 ? reference.shell.sections[0] : reference.sections[i];
    for (const [phase, y] of [
      ["start", ref.bounds.y],
      ["center", ref.bounds.y + Math.max(0, (ref.bounds.height - height) / 2)],
      ["end", ref.bounds.y + Math.max(0, ref.bounds.height - height)],
    ]) {
      await scroll(y);
      await shot(`${s.id}-${phase}`);
    }
    const locator =
      i === 6 ? page.locator(footer) : page.locator(`${root}>section`).nth(i);
    const path = `${out}/${width}-${s.id}-crop.png`;
    await locator.screenshot({ path, timeout: 30000 });
    source.artifacts.push({
      name: `${s.id}-crop`,
      path,
      scrollY: await page.evaluate(() => scrollY),
      fullPage: false,
    });
  }
  await scroll(0);
  await shot("overview", true);
  if (introOnly) {
    const previous = JSON.parse(await readFile(`${out}/${width}.json`, "utf8"));
    if (
      JSON.stringify(previous.sections.map((s) => s.bounds)) !==
      JSON.stringify(source.sections.map((s) => s.bounds))
    )
      throw new Error(
        "Intro-only refresh would invalidate section geometry; run full capture",
      );
    const refreshed = new Set(source.artifacts.map((a) => a.name));
    previous.artifacts = previous.artifacts
      .filter((a) => !refreshed.has(a.name))
      .concat(source.artifacts);
    previous.introRefreshedAt = source.observedAt;
    previous.errors.push(...errors);
    await writeFile(`${out}/${width}.json`, JSON.stringify(previous, null, 2));
    console.log(role, width, "intro refreshed", errors);
    await page.close();
    continue;
  }
  const track = role === "reference" ? ".c-home-circle" : ".mg-circle-track";
  const bounds = await page.locator(track).evaluate((e) => ({
    start: e.getBoundingClientRect().y + scrollY,
    height: e.offsetHeight,
  }));
  const refCircle =
    role === "actual" ? reference.motion.find((x) => x.id === "circle") : null;
  const start = refCircle?.pinStart ?? bounds.start,
    end = refCircle?.pinEnd ?? bounds.start + bounds.height - height;
  const motion = {
    id: "circle",
    trigger: "scroll",
    property: "crop scale / image scale",
    pinStart: bounds.start,
    pinEnd: bounds.start + bounds.height - height,
    pinDistance: bounds.height - height,
    horizontalTravel: 0,
    easing: ["quadratic-in-out", "quadratic-out"],
    interruption: "reversible",
    reducedMotion: "static full image (intentional accessibility adaptation)",
    samples: [],
  };
  for (const [phase, f] of [
    ["start", 0],
    ["mid", 0.5],
    ["end", 1],
    ["reverse", 0],
  ]) {
    await scroll(start + (end - start) * f);
    const measured = await page.evaluate((role) => {
      const crop = document.querySelector(
        role === "reference" ? '[x-ref="images"]' : ".mg-circle-crop",
      );
      const image = document.querySelector(
        role === "reference" ? '[x-ref="imagesInner"]' : ".mg-circle-image",
      );
      return {
        crop: crop.getBoundingClientRect().width,
        image: image.getBoundingClientRect().width,
      };
    }, role);
    motion.samples.push({ phase, ...measured, path: await shot(`circle-${phase}`) });
  }
  source.motion.push(motion);
  await scroll(reference.shell.sections[0].bounds.y);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.waitForTimeout(1300);
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(0, 0);
  await shot("menu");
  source.shell.links = await page
    .locator(role === "reference" ? ".c-site-menu a" : ".mg-menu a")
    .evaluateAll((es) => es.map((e) => ({ href: e.href, text: e.textContent.trim() })));
  source.errors = errors;
  await writeFile(`${out}/${width}.json`, JSON.stringify(source, null, 2));
  console.log(role, width, meta.scrollHeight, errors);
  await page.close();
}
await browser.close();
