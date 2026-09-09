# Superseded image generations

All calls used subscription-backed built-in image_gen. Pixel model/quality
parameters were not exposed. Initial exact prompt is in landscape-prompt.md;
current production exact prompt is in production-prompt.md. This file records
the two intervening generations. Neither is shipped by the page.

## Alpine reframing — superseded by user's realism feedback

Input role: edit target, original alpine PNG
`/home/kokoro/.codex/generated_images/01a08624-024c-7e01-8fea-c7b893cff1bd/exec-ea9204b8-d67d-411f-8ee9-809eb61ed7b9.png`.
Output in the same folder: `exec-28388c30-d997-40e2-a832-1f5c615de197.png`.
Square1254px. Crop improved, style not accepted. Exact prompt:

Recompose this photograph for a centered circular-to-widescreen crop. Preserve the original fictional alpine lake, beautiful dawn lighting, realistic stone and snow, calm teal reflection, fine mist and cinematic photorealistic quality. The current mountain is too tall and its summit is too close to the top. Pull the camera BACK significantly and make the whole central mountain mass smaller: move its highest summit from near 12% of the canvas height to exactly 31% of the canvas height, while keeping its x position at 50%. The shoreline should be at 53% height and reflected peak at 72% height. Add more natural pale blue/peach sky above, and extend the clear lake below. Keep a distant, exceptionally impressive central summit, readable even as a small circle. All essential mountain silhouette must fit between y30% and y53%, centered inside x30%-70%. Maintain a SQUARE canvas, not a panoramic image; the middle horizontal 50% of the square must itself form a complete breathtaking landscape. Remove the large foreground terrace; only a barely visible natural stone shore at the bottom edge if necessary. No text, logos, people, boats, frames or UI. Final-quality natural editorial photography, no oversized fantasy mountain.

## Fjord — rejected as realistic but insufficiently impressive

No image references. Output in the same generation folder:
`exec-a65e768a-c6d2-4270-9829-8b5704afacfd.png`, 1254×1254.
Retained source: `assets/source/generated/adelva/about/fjord-source.png`.
Unselected WebP removed from public/media. Exact prompt:

A real-looking location photograph of a remote Norwegian fjord, taken from a low rocky shore on a quiet overcast September morning with a full-frame camera and a normal 45mm lens. A huge, blunt, irregular granite mountain wall dominates the center, weathered grey rock with muted green moss and sparse vegetation, rising steeply from cold grey-green water; its uneven ridge lies around one third down the square frame. One flank descends much lower than the other. The mountain feels physically enormous, not a perfect triangular summit. Layered distant cliffs partly disappear into ordinary low cloud; small patches of fog cling unevenly to the hillside. Soft flat daylight, restrained exposure, cool grey sky, imperfect real-world visibility and subtle atmospheric depth. Water has small wind ripples and only broken indistinct reflections, NOT mirror symmetry. A few wet dark stones at the extreme bottom edge. Render the imperfect, understated realism of an unretouched travel photograph: credible geology, naturally varied textures, no excessive microcontrast, no HDR, no orange sunrise, no sun rays, no glowing snow, no oversaturated teal, no perfect symmetry, no fantasy peaks, no artificial smoothness. Square composition, the essential massive cliff centered in the middle 40% of width, ridge at y32%, waterline y62%, so a centered circular crop and a horizontal center crop both retain the dramatic landform. Breathtaking through actual scale and remoteness, not spectacle effects. No people, buildings, boats, lettering, logos or watermark. Final photographic quality.
