/**
 * Tell IndexNow search engines (Bing, Yandex, Naver, Seznam…) that the
 * published pages changed. Run after a production deploy:
 * `node scripts/seo/indexnow.mjs`.
 *
 * The key is public by design: IndexNow verifies ownership by fetching
 * `/<key>.txt` from the same host.
 */
const host = "www.adelva.jp";
const key = "8cd899035b8f54e6c01db9510bf49d64";

const sitemap = await (await fetch(`https://${host}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const keyLocation = `https://${host}/${key}.txt`;
if ((await (await fetch(keyLocation)).text()).trim() !== key) {
  throw new Error(`${keyLocation} does not serve the key; deploy it first.`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});
console.log(
  `IndexNow ${response.status} ${response.statusText} for ${urlList.length} URLs`,
);
if (!response.ok && response.status !== 202) process.exitCode = 1;
