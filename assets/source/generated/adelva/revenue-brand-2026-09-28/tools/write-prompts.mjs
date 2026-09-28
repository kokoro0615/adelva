// Writes the clean-plate prompts for the revenue-brand page (authored by Opus 5.5).
// Every prompt = shared opening + this image's scene + this image's overlay list
// + shared keep/detail/negative rules. Run from the asset folder:
//   node tools/write-prompts.mjs
import { writeFileSync } from "node:fs";

const LOOK =
  "one continuous aerial night photograph, taken from a drone at a slightly oblique angle in deep blue hour, of a single mountain river running through a dense misty conifer forest: the water glows a cold white-blue, the boulders are wet dark granite, and soft grey mist drifts in irregular patches over the treetops";

const KEEP_TAIL =
  "— the same framing, camera angle, scale and perspective, the same colour grade and light. Do not move, add or remove any river bend, stream, shore, island, building, boulder or patch of mist: the result must still line up with the input when the two are overlaid.";

const DETAIL =
  "Redraw the photographic detail as sharply and finely as possible at full resolution: individual conifer crowns and needles, wet granite boulders, foaming white water, fine ripples, soft translucent mist. It must read as a crisp high-resolution photograph, not a soft upscale.";

const NEGATIVE =
  "The result must contain no text, letters, numbers, logos, lines, dotted lines, dots, rings, corner brackets, arrows, check marks, icons, buttons, pills, panels, dark translucent bands, vignettes or UI of any kind — only the photograph. No people.";

const ORANGE_WATER =
  "In the input, some streams carry a painted orange glow or a thin orange or white line along them: that is UI, not light. Remove it so that this water is the same natural cold white-blue as the rest of the river, with no orange light anywhere on the water.";

const WARM_KEEP =
  "The warm amber light in the ryokan's windows and the small lanterns along its pier are part of the photograph: keep them exactly as they are.";

const RIGHT_RAIL =
  "the thin vertical line with small hollow circles, an orange dot, a small square and tiny labels near the right edge";

function edit({ id, frame, scene, remove, keep, extra = [], size }) {
  const text = [
    `Edit this image into a clean, text-free photographic plate. It is ${frame} of a tall website mock drawn over ${LOOK}. ${scene}`,
    `Remove every non-photographic overlay and fill those areas with the photograph that would be behind them: ${remove}. Where an overlay sat over forest, water, rocks, shore or mist, continue exactly that forest, water, rocks, shore or mist.`,
    ...extra,
    `Keep everything else exactly where it is and as it is: ${keep} ${KEEP_TAIL}`,
    DETAIL,
    `${NEGATIVE} ${size}`,
  ].join("\n");
  writeFileSync(`prompts/${id}.txt`, `${text}\n`);
}

const D_FRAME = "one horizontal slice (one screen of a 1440 px wide desktop page)";
const D_SIZE = "Landscape 3:2, the same size as the input (1536×1024).";
const M_FRAME = "one portrait slice (one screen of a 390 px wide mobile page)";
const M_SIZE = "Portrait, the same size as the input (853×1844).";

const desktop = {
  D00: {
    scene:
      "This is the very top of the page: five narrow mountain streams run down five parallel forested ridges from the top edge and begin to converge towards the lower middle, where one stream leaves the bottom of the frame slightly right of centre.",
    remove:
      "the ADELVA logo and the whole navigation bar along the top edge, including the outlined button at the top right; the five small outlined labels and the orange dots on the five streams, with their short leader lines; the breadcrumb; the orange number with its vertical divider and label; the large white heading; the spaced capital letters under it; the two lines of text; the orange button; the word SCROLL with its short vertical line; the horizontal translucent band near the bottom with its two thin rules, three small circles, orange numbers, labels and small arrows; and " +
      RIGHT_RAIL,
    extra: [ORANGE_WATER],
    keep: "the five streams and their exact courses, the ridges between them, the forest, the rocks and the patches of mist",
  },
  D01: {
    scene:
      "At the top a single river runs down the centre; below it two wide systems of braided tributaries fan out to the left and to the right and flow back down into the centre, meeting in one confluence just above the bottom edge.",
    remove:
      "the orange button and the word SCROLL at the top; the horizontal translucent band with its two thin rules, three small circles, orange numbers, labels and small arrows; the orange number and the large white heading in the middle; the ten outlined labels on the left and right (one of them filled orange), each with its thin leader line and round dot; the thin orange and white lines drawn along the tributaries; the large glowing orange ring at the confluence and the orange-outlined label beside it; the orange numbers, white headings and small text at the bottom left and bottom right; and " +
      RIGHT_RAIL,
    extra: [ORANGE_WATER],
    keep: "every tributary, braid and gravel bar, the confluence, the forest, the rocks and the mist",
  },
  D02: {
    scene:
      "A single white-water river tumbles down the centre over big boulders between dense forest, then pours into the top of a calm dark lake that opens across the bottom of the frame, with forested shores and rocky edges on both sides.",
    remove:
      "the two outlined labels cut by the top edge with their leader lines and dots; the orange ring and the orange-outlined label at the top centre; the orange numbers, white headings and small text at the top left and top right; the thin wavy orange line running down the river and the orange dotted line where it enters the lake; the orange numbers at the bottom centre; and " +
      RIGHT_RAIL,
    keep: "the course of the river, every boulder and cascade, the lake shores, the forest and the mist",
  },
  D03: {
    scene:
      "A calm, glassy lake fills most of the frame, reflecting a faint night sky and wisps of cloud, framed by forested shores with rocky edges; at the bottom centre the dark roofs of a lakeside ryokan with warm-lit windows begin to appear among the trees.",
    remove:
      "the thin orange dotted line at the top centre; the orange numbers and the large white heading in the middle of the lake, and its mirrored, blurred reflection under it; the orange numbers, white headings and thin bracket lines lower down; the nine small outlined labels (one of them filled orange); the small line of text below them; the four orange corner brackets around one of the buildings at the bottom; and " +
      RIGHT_RAIL +
      ". The lake under the removed heading and its reflection must be the same calm water with the same faint reflections as around it",
    extra: [WARM_KEEP],
    keep: "the lake, its shores and rocks, the forest, the mist and the ryokan buildings",
  },
  D04: {
    scene:
      "At the top a fictional traditional Japanese ryokan stands on the lake shore — dark tiled roofs, warm-lit windows, a garden and a small wooden pier with lanterns reaching into the lake on the right — and from below it a rocky white-water river runs down through dense forest to the bottom edge.",
    remove:
      "the small line of text at the very top; the four orange corner brackets around one of the ryokan buildings; and the thin orange line running down the river",
    extra: [WARM_KEEP],
    keep: "the ryokan, its roofs, windows, garden and pier, the lake edge, the river and its boulders, the forest and the mist",
  },
  D05: {
    scene:
      "A white-water river comes down from the top through dense forest and, in the lower half, swings into a wide loop that circles a round forested island before continuing down; the right third of the frame is dark forest and mist.",
    remove:
      "the thin orange line along the river and around the loop, with its small arrow head; the six small outlined labels with their leader lines and small circles, and the glowing orange ring on the loop; the orange numbers, the white heading, the second heading and the two lines of text on the right; and " +
      RIGHT_RAIL,
    extra: [ORANGE_WATER],
    keep: "the course of the river, the whole loop and the island inside it, the forest, the rocks and the mist",
  },
  D06: {
    scene:
      "At the top the river leaves the bottom of a loop around a forested island; below, it runs straight down the centre of the frame over boulders between dense forest, with patches of mist on both sides.",
    remove:
      "the thin orange line along the river; the two small outlined labels with their leader lines and circles at the top; the white heading; the four orange numbers, the four white headings and the four lines of small text on both sides; the thin horizontal arrows reaching from the centre towards them; the outlined box with a line of text; and any soft dark panel behind the text",
    keep: "the course of the river, the loop at the top, every boulder, the forest and the mist",
  },
  D07: {
    scene:
      "A straight rocky white-water river runs down the centre through dense forest, with big patches of mist drifting on both sides.",
    remove:
      "the two lines of small text along the top edge; the outlined box with a line of text below them; the thin orange line along the river; the white heading, the line of text and the two lines of smaller text in the lower part; the orange and white numbers at the lower left with the thin orange vertical line under them; any soft dark panel behind the text; and " +
      RIGHT_RAIL,
    keep: "the course of the river, the boulders, the forest and the mist",
  },
  D08: {
    scene:
      "A white-water river winds down through a valley of small terraced rice fields with wooden drying racks, between dense conifer forest with patches of mist.",
    remove:
      "the white heading and the lines of text at the top; the thin vertical line with small circles at the far left; the orange and white numbers, the white step headings, the orange check marks and the small outlined labels on both sides of the river, each with its thin leader line; the rings and circles on the river; the thin orange and white lines along the river; any soft dark panels behind the text; and " +
      RIGHT_RAIL,
    extra: [ORANGE_WATER],
    keep: "the course of the river, every terraced field and drying rack, the forest and the mist",
  },
  D09: {
    scene:
      "A white-water river winds down between terraced fields and forest; in the lower right a fictional traditional Japanese ryokan with dark tiled roofs and warm-lit windows stands on the shore of a calm lake, with a small wooden pier with lanterns.",
    remove:
      "the orange and grey numbers, the white and grey step headings and the small outlined labels, each with its thin leader line; the rings and circles on the river; the thin orange and white lines along the river; the white line of text with its orange underline and arrow on the lake at the right; and any soft dark panels behind the text",
    extra: [WARM_KEEP],
    keep: "the course of the river, the terraced fields, the ryokan, its roofs, windows and pier, the lake, the forest and the mist",
  },
  D10: {
    scene:
      "At the top a fictional traditional Japanese ryokan with warm-lit windows stands on the shore of a calm lake with a small wooden pier and lanterns; the river flows past it into the lake; below, dense conifer forest with mist grows darker and darker towards the bottom edge.",
    remove:
      "the white line of text with its orange underline and arrow on the lake; the thin white line along the river; the small glowing orange square with its halo on the river; and any soft dark panels",
    extra: [
      WARM_KEEP,
      "Keep the gradual darkening towards the bottom exactly as smooth as in the input, with no hard edge and no band.",
    ],
    keep: "the ryokan, its roofs, windows and pier, the lake, the river, the forest and the fade into darkness",
  },
};

const mobile = {
  M1: {
    scene:
      "This is the very top of the page: five narrow mountain streams run down five parallel forested ridges from the top edge; in the middle of the frame they merge and a single rocky white-water river continues down to the bottom edge, slightly right of centre.",
    remove:
      "the ADELVA logo, the outlined button and the three-line menu icon along the top; the five small outlined labels and the orange dots on the five streams, with their short leader lines; the breadcrumb; the orange number with its vertical divider and label; the two-line large white heading; the spaced capital letters under it; the two lines of text; the orange button; the word SCROLL with its short vertical line; the thin orange line running down the river; and the thin vertical line with circles and a small square at the right edge",
    extra: [ORANGE_WATER],
    keep: "the five streams and their exact courses, the ridges between them, the main river, the forest, the rocks and the patches of mist",
  },
  M2: {
    scene:
      "At the top a single river runs down the centre; below it two systems of braided tributaries fan out towards the left and right edges and flow back into the centre, where they meet; from that confluence one wide white-water river runs down to the bottom edge.",
    remove:
      "the translucent dark rectangular panel at the top with its three rows of orange numbers, labels, small arrows, thin rules and the vertical line with circles; the orange numbers and the large white heading; the ten outlined labels on the left and right (one of them filled orange), each with its thin leader line and round dot; the small glowing dots; and the thin orange lines along the tributaries and down the river",
    extra: [ORANGE_WATER],
    keep: "every tributary, braid and gravel bar, the confluence, the river below it, the forest, the rocks and the mist",
  },
  M3: {
    scene:
      "A white-water river tumbles down through forest over big boulders and pours into the top of a calm, glassy lake that fills the lower half of the frame, reflecting a faint night sky, with forested shores and rocky edges on both sides.",
    remove:
      "the orange numbers, white headings and small text at the top left and at the right; the thin wavy orange line down the river; the orange numbers and the large white heading on the lake and its mirrored, blurred reflection; and the thin orange dotted line running down the lake. The lake under the removed heading and its reflection must be the same calm water with the same faint reflections as around it",
    keep: "the course of the river, every boulder and cascade, the lake shores, the forest and the mist",
  },
  M4: {
    scene:
      "A calm, glassy lake fills most of the frame between forested shores with rocky edges; at the bottom a fictional traditional Japanese ryokan with dark tiled roofs and warm-lit windows stands among pines on the shore, with a small wooden pier with lanterns reaching into the lake on the right.",
    remove:
      "the thin orange dotted line running down the lake; the orange numbers, white headings and thin bracket lines; the nine small outlined labels (one of them filled orange and glowing); the small line of text below them; and the four orange corner brackets around one of the buildings at the bottom",
    extra: [WARM_KEEP],
    keep: "the lake, its shores and rocks, the forest, the mist, the ryokan buildings and the pier",
  },
  M5: {
    scene:
      "A rocky white-water river runs down from the top through dense forest and, in the lower half, swings into a wide loop around a round forested island before continuing down.",
    remove:
      "the thin orange line along the river and around the loop, with its small arrow head; the orange numbers, the white heading, the second heading and the two lines of text at the upper left; the small outlined labels (one of them filled orange) with their leader lines and circles; and the glowing orange ring on the loop",
    extra: [ORANGE_WATER],
    keep: "the course of the river, the loop and the island inside it, the forest, the rocks and the mist",
  },
  M6: {
    scene:
      "At the top the river leaves the bottom of a loop; below it a wide rocky white-water river runs down the left part of the frame between dense forest, with mist on the right.",
    remove:
      "any small outlined label with its leader line and circle near the top; the thin orange line along the river; the white heading; the four orange numbers, white headings and lines of small text on the right; the four orange dots on the river with the thin horizontal lines reaching right from them; the outlined box with two lines of text at the bottom; and any soft dark panel behind the text",
    keep: "the course of the river, the loop at the top, every boulder, the forest and the mist",
  },
  M7: {
    scene:
      "A rocky white-water river winds down through dense forest with drifting mist; in the lower half the forest opens onto small terraced rice fields with wooden drying racks on both sides of the river.",
    remove:
      "the thin orange line along the river; the white heading and the lines of text in the upper left; the orange and white numbers with the row of short orange and grey dashes; the orange and white numbers, the white step headings, the orange check marks, the small outlined labels, their thin leader lines and the rings on the river; and any soft dark panels behind the text",
    keep: "the course of the river, every terraced field and drying rack, the forest and the mist",
  },
  M8: {
    scene:
      "A white-water river winds down between terraced fields and forest into a calm lake; on the lake shore at the right stands a fictional traditional Japanese ryokan with dark tiled roofs and warm-lit windows and a small wooden pier with lanterns; below, the forest sinks into deep shadow and fades smoothly into flat blue-black at the bottom.",
    remove:
      "the orange and grey numbers, the white and grey step headings and the small outlined labels, each with its thin leader line; the rings and circles on the river; the thin orange and white lines along the river; the small orange square on the shore; the white line of text with its orange underline and arrow on the lake; and any soft dark panels behind the text",
    extra: [
      ORANGE_WATER,
      WARM_KEEP,
      "Keep the gradual fade into flat blue-black at the bottom exactly as smooth as in the input, with no hard edge and no band.",
    ],
    keep: "the course of the river, the terraced fields, the lake, the ryokan, its roofs, windows and pier, the forest and the fade into darkness",
  },
};

for (const [id, spec] of Object.entries(desktop)) edit({ id, frame: D_FRAME, size: D_SIZE, ...spec });
for (const [id, spec] of Object.entries(mobile)) edit({ id, frame: M_FRAME, size: M_SIZE, ...spec });

const CARD_NEG =
  "The result must contain no text, letters, numbers, logos, lines, arrows, icons, borders, frames, gradients added for text or UI of any kind — only the photograph. No people. The same aspect ratio as the input.";
const cards = {
  C1: [
    "Edit this image into a clean, text-free photographic plate. It is the photograph inside a website card: an evening aerial view, slightly oblique, into the inner garden of a fictional traditional Japanese ryokan in a pine forest — dark tiled roofs of wooden wings with warm-lit shoji windows, a large broad-leaved tree with a lantern glowing beneath it, a moss garden with weathered rocks and a winding path of stepping stones.",
    "Remove every non-photographic overlay and fill those areas with the photograph that would be behind them: the orange number and the white heading in the lower left, the two lines of small white text under them, the orange arrow at the lower right, the thin orange line winding along the stepping-stone path, and the dark gradient that darkens the lower part for the text. Continue the moss, stones, path, shrubs and pines naturally.",
    "Keep everything else exactly where it is: the roofs, windows, the tree and lantern, the rocks, the stepping stones and the forest — the same framing, angle, colour and warm evening light.",
    "Redraw the photographic detail as sharply and finely as possible at full resolution: roof tiles, timber, shoji paper, bark, moss, lichen on the rocks, pine needles.",
    CARD_NEG,
  ],
  C2: [
    "Edit this image into a clean, text-free photographic plate. It is the photograph inside a website card: an evening aerial view, slightly oblique, of the back-of-house yard of a fictional traditional Japanese ryokan in a pine forest — a wide gravel yard, a long wooden building with a dark metal roof on the right, smaller service buildings and a storehouse with warm lights, and a path leading back between tall pines.",
    "Remove every non-photographic overlay and fill those areas with the photograph that would be behind them: the orange number and the white heading in the lower left, the two lines of small white text under them, the white arrow at the lower right, and the dark gradient that darkens the lower part for the text. Continue the gravel, the building and the trees naturally.",
    "Keep everything else exactly where it is: every building, roof and lit window, the gravel yard, the path and the forest — the same framing, angle, colour and warm evening light.",
    "Redraw the photographic detail as sharply and finely as possible at full resolution: roof seams, timber, gravel, pine needles.",
    CARD_NEG,
  ],
};
for (const [id, parts] of Object.entries(cards)) writeFileSync(`prompts/${id}.txt`, `${parts.join("\n")}\n`);

const fog = {
  F1: "A photographic compositing element: a few large, soft wisps of low mountain fog, as seen from a drone looking down on a night forest, isolated on a pure black background (#000000). The fog is pale blue-grey and translucent, in three or four separate irregular patches of different sizes, some stretched diagonally, with thick soft centres and feathered edges that dissolve completely into the black; generous empty black space between and around them, and nothing touches the edges of the frame. Nothing else in the image: no trees, ground, water, horizon, sky, stars, light source, frame or text. Landscape 3:2.",
  F2: "A photographic compositing element: many thin, delicate strands and small torn wisps of drifting mist, as seen from a drone looking down on a night forest, isolated on a pure black background (#000000). The mist is pale blue-grey, very translucent and fibrous, scattered loosely across the frame in a gentle diagonal drift, with feathered edges that dissolve completely into the black and plenty of empty black space; nothing touches the edges of the frame. Nothing else in the image: no trees, ground, water, horizon, sky, stars, light source, frame or text. Landscape 3:2.",
};
for (const [id, text] of Object.entries(fog)) writeFileSync(`prompts/${id}.txt`, `${text}\n`);
console.log("prompts written");
