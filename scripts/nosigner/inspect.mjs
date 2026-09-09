import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
const data = await p.evaluate(() => {
  const tree = (el, d = 0) => ({
    tag: el.tagName,
    cls: el.className,
    id: el.id,
    text: el.children.length ? undefined : el.textContent?.slice(0, 300),
    children:
      d < 5
        ? [...el.children]
            .filter((x) => !["SCRIPT", "STYLE", "PATH"].includes(x.tagName))
            .map((x) => tree(x, d + 1))
        : undefined,
  });
  return {
    tree: tree(document.querySelector(".pageContainer")),
    custom: [
      ...document.querySelectorAll(
        "header-layer,language-select,menu-button,menu-nav,contact-conversion,opt-in-layer",
      ),
    ].map((x) => ({ tag: x.tagName, html: x.outerHTML })),
    styles: [...document.styleSheets]
      .filter((s) => s.href?.includes("nosigner"))
      .map((s) => ({
        url: s.href,
        text: [...s.cssRules].map((r) => r.cssText).join("\n"),
      })),
  };
});
await writeFile("references/nosigner/dom.json", JSON.stringify(data, null, 2));
for (let i = 0; i < data.styles.length; i++)
  await writeFile(`references/nosigner/source-${i}.css`, data.styles[i].text);
console.log(JSON.stringify(data.tree, null, 2).slice(0, 21000));
await b.close();
