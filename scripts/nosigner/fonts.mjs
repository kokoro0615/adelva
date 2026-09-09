import { readFile, writeFile, mkdir } from "node:fs/promises";
await mkdir("public/fonts/nosigner", { recursive: true });
const records = [];
for (const name of ["NOSIGNER-Bold.woff2"]) {
  const url = "https://nosigner.com/fonts/" + name;
  const r = await fetch(url);
  if (!r.ok) throw Error(r.status);
  await writeFile("public/fonts/nosigner/" + name, Buffer.from(await r.arrayBuffer()));
  records.push({
    path: "public/fonts/nosigner/" + name,
    source: url,
    owner: "NOSIGNER",
    license: "User-confirmed permission 2026-09-09",
    role: "Display lettering",
    status: "approved",
  });
}
const data = JSON.parse(await readFile("references/nosigner/extract-1440.json"));
const details = JSON.parse(await readFile("references/nosigner/details.json"));
const chars = [
  ...new Set(
    JSON.stringify(data)
      .concat(
        JSON.stringify(details.quote),
        "メニューを開く閉じる検索日本語すべて同意する必要なクッキーのみ当サイトでは、ユーザー体験の最適化とサイト改善のためにクッキーを使用しています。詳細はクッキーポリシーをご確認ください。",
      )
      .split(""),
  ),
].join("");
const url =
  "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700&display=swap&text=" +
  encodeURIComponent(chars);
let css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const remote = css.match(/url\(([^)]+)\)/)?.[1];
if (!remote) throw Error(css);
await writeFile(
  "public/fonts/nosigner/zen-kaku-700.woff2",
  Buffer.from(await (await fetch(remote)).arrayBuffer()),
);
records.push({
  path: "public/fonts/nosigner/zen-kaku-700.woff2",
  source: remote,
  owner: "Google Fonts / Zen project",
  license: "SIL Open Font License; user-confirmed site permission",
  role: "Japanese text subset",
  status: "approved",
});
await writeFile(
  "references/nosigner/font-manifest.json",
  JSON.stringify(records, null, 2),
);
console.log(css.slice(0, 200));
// Logo is a licensed vector asset, not a screenshot or copied page.
const logo = details.logo
  .replace("<symbol", '<svg xmlns="http://www.w3.org/2000/svg"')
  .replace("</symbol>", "</svg>")
  .replace(/id="logo"/, "");
await writeFile("public/media/nosigner/logo.svg", logo);
