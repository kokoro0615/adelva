import { challenges, serviceDomains } from "./adelva-navigation";
import photoTiles from "./adelva-photo-tiles.json" with { type: "json" };

/** Original generated landscape assets. Provenance and exact prompts:
 * assets/source/generated/adelva/challenges-2026-09-09/manifest.json.
 * Fictional landscapes; these do not depict ADELVA client properties. */
export const challengesHero = [
  {
    id: "mountain",
    alt: "雲海に連なる山々と、森に佇む宿のイメージ",
    position: "75% 50%",
  },
  {
    id: "coast",
    alt: "海を見渡す雄大な断崖と、石造りの宿のイメージ",
    position: "38% 50%",
  },
  {
    id: "desert",
    alt: "広大な砂岩の峡谷と、水盤のある宿のイメージ",
    position: "58% 50%",
  },
  { id: "forest", alt: "霧に包まれる森と湖畔の宿のイメージ", position: "50% 50%" },
  {
    id: "snow",
    alt: "朝日に染まる雪山と、稜線に佇む宿のイメージ",
    position: "50% 50%",
  },
].map((scene) => ({
  ...scene,
  image: {
    src: `/media/adelva/challenges/${scene.id}-1672.webp`,
    srcSet: `/media/adelva/challenges/${scene.id}-840.webp 840w, /media/adelva/challenges/${scene.id}-1672.webp 1672w`,
    width: 1672,
    height: 941,
  },
}));

export interface AdelvaBand {
  id: string;
  label: string;
  body: string;
  href: string;
  reverse: boolean;
  square?: boolean;
  images: { src: string; srcSet: string; width: number; height: number }[];
}
/** Four genuinely different photos, followed by presentation-only loop copies.
 * Provenance: assets/source/generated/adelva/photo-tiles-2026-09-09/manifest.json.
 * Start with a square subject so a neighboring photo is visible on mobile. */
const bandImages = (id: string) => {
  const additions = photoTiles.filter((photo) => photo.band === id);
  const lead = additions.find((photo) => photo.width === photo.height);
  if (!lead || additions.length !== 3) {
    throw new Error(`Missing generated photo sequence: ${id}`);
  }
  const landscape = {
    src: `/media/adelva/challenge-bands/${id}-1536.webp`,
    srcSet: `/media/adelva/challenge-bands/${id}-768.webp 768w, /media/adelva/challenge-bands/${id}-1536.webp 1536w`,
    width: 1536,
    height: 1024,
  };
  return [lead, landscape, ...additions.filter((photo) => photo !== lead)];
};
export const challengeBands: AdelvaBand[] = challenges.map((item, index) => {
  const id = item.href.split("#")[1];
  return {
    id,
    label: item.label,
    body: item.description ?? "",
    href: serviceDomains[[0, 0, 0, 1, 2][index]].href,
    reverse: index % 2 === 0,
    images: bandImages(id),
  };
});
export const supportBands: AdelvaBand[] = serviceDomains.map((item, index) => ({
  id: `support-${item.id}`,
  label: item.label,
  body: item.description ?? "",
  href: item.href,
  reverse: index % 2 === 0,
  square: true,
  images: bandImages(
    ["management-operations", "brand-growth", "dx-it-procurement"][index],
  ),
}));
