/**
 * WebGL renderer of the narrow-viewport camera (< 1024 px) of
 * /services/management-operations (polish 2026-10-13).
 *
 * The photograph and its light layers are streamed as small texture tiles
 * (`scripts/adelva/prepare-management-operations-phone.mjs`), uploaded once,
 * mipmapped, and kept only while the camera is near them: decoded image data
 * stays under BUDGET (rule R5: ≤ 64 MB alive on a phone). Each frame draws a
 * handful of textured quads; the masks of the prototype's light band, warm
 * band and dawn are evaluated in the fragment shader, so nothing is
 * re-composited on the CPU and nothing depends on the photograph's colours.
 *
 * GLSL ES 1.00 so the same shaders run on WebGL 2 (mipmaps for non-power-of-two
 * tiles) and WebGL 1 (no mipmaps). Fragment precision is `highp` where the GPU
 * has it; every coordinate that reaches the fragment shader is small (tile
 * local plate px, CSS px, texture uv), so `mediump` GPUs stay exact too.
 */
import {
  phoneTiles,
  type PhoneLayer,
} from "@/content/adelva-management-operations-phone-tiles";

export type LayerName = keyof typeof phoneTiles.layers;

export interface Cam {
  cx: number;
  cy: number;
  d: number;
}

/** Plate-px rectangle. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** What one layer draw needs besides its tiles. All coordinates in plate px. */
export interface LayerDraw {
  readonly layer: LayerName;
  readonly alpha: number;
  /** Horizontal light band: 0→1 over [x0, x1], 1→0 over [x2, x3]. */
  readonly bandX?: readonly [number, number, number, number];
  /** Nothing below this plate row. */
  readonly clipBottom?: number;
  /** Vertical warm band: triangle centred on `[0]`, half width `[1]`. */
  readonly bandY?: readonly [number, number];
  /** Alpha 1→0 from `[0]` to `[1]` (bottom feather of the top variants). */
  readonly fadeBottom?: readonly [number, number];
  /** Alpha 0→1 from `[0]` to `[1]`. */
  readonly fadeTop?: readonly [number, number];
  /** Screen-space focus: transparent inside `r0` CSS px of (x, y), opaque beyond `r1`. */
  readonly focus?: readonly [number, number, number, number];
  /** RGB multiplier. */
  readonly gain?: number;
  /**
   * A single-texture layer (blur, soft) mixed into this one in the same pass,
   * inside this layer's own coverage — one full-screen pass instead of two.
   */
  readonly over?: Overlay;
}

export interface Overlay {
  readonly layer: LayerName;
  readonly alpha: number;
  readonly focus?: readonly [number, number, number, number];
  readonly fadeBottom?: readonly [number, number];
  readonly fadeTop?: readonly [number, number];
  readonly gain?: number;
}

/** A radial glow with up to three colour stops (premultiplied in the shader). */
export interface Glow {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  /** [r, g, b, a] at 0, mid and 1 (0–255 colour, 0–1 alpha). */
  readonly stops: readonly (readonly [number, number, number, number])[];
  readonly mid: number;
  readonly alpha: number;
  readonly screen: boolean;
}

export interface Renderer {
  readonly webgl2: boolean;
  resize(vw: number, vh: number, dpr: number): void;
  /** Wanted tiles, most urgent first. Starts loads; never evicts these. */
  want(keys: readonly string[]): void;
  /** Tiles of `layer` under `rect`. */
  tilesOf(layer: LayerName, rect: Rect): string[];
  /** All tiles of `keys` uploaded. */
  has(keys: readonly string[]): boolean;
  /** True while a tile is fading in (the caller keeps drawing). */
  fading(): boolean;
  /** Tiles uploaded so far are shown at once (no fade-in) — the first frame. */
  settle(): void;
  /** The page's ink over everything drawn so far, at `alpha`. */
  veil(alpha: number): void;
  begin(cam: Cam): void;
  layer(draw: LayerDraw): void;
  glow(glow: Glow): void;
  /** Comet geometry: [x, y, u, v, r, g, b, a, kind] per vertex, triangles. */
  shapes(vertices: Float32Array, count: number): void;
  end(): void;
  /** Uploads waiting bitmaps; returns true when something changed. */
  pump(): boolean;
  stats(): { bytes: number; tiles: number; loading: number; queued: number };
  onChange(fn: () => void): void;
  dispose(): void;
}

const BUDGET = 52 * 1024 * 1024;
const MAX_LOADS = 6;
const FADE_MS = 220;
const UPLOAD_BUDGET_MS = 6;
const RETRY_MS = 3000;

const VS_LAYER = `
attribute vec2 aUnit;
uniform vec4 uRect;   // plate x, y, w, h of the quad
uniform vec4 uUv;     // uv origin and size of the quad
uniform vec4 uCam;    // cx, cy, 1/d
uniform vec2 uView;   // CSS px
uniform vec4 uOverMap; // overlay uv = (plate - xy) * zw
varying vec2 vUv;
varying vec2 vOverUv;
varying vec2 vLocal;
varying vec2 vScreen;
void main() {
  vec2 local = aUnit * uRect.zw;
  vec2 plate = uRect.xy + local;
  vec2 s = (plate - uCam.xy) * uCam.z + 0.5 * uView;
  vUv = uUv.xy + aUnit * uUv.zw;
  vOverUv = (plate - uOverMap.xy) * uOverMap.zw;
  vLocal = local;
  vScreen = s;
  gl_Position = vec4(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0, 0.0, 1.0);
}`;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const FS_LAYER = `${PRECISION}
varying vec2 vUv;
varying vec2 vOverUv;
varying vec2 vLocal;
varying vec2 vScreen;
uniform sampler2D uTex;
uniform sampler2D uOver;
uniform float uOverOn;
uniform vec4 uOverFocus;
uniform vec2 uOverFadeB;
uniform vec2 uOverFadeT;
uniform float uOverGain;
uniform float uAlpha;
uniform vec4 uBandX;
uniform float uClip;
uniform vec3 uBandY;
uniform vec2 uFadeB;
uniform vec2 uFadeT;
uniform vec4 uFocus;
uniform float uGain;
void main() {
  float a = uAlpha;
  if (uBandX.w > uBandX.x) {
    a *= clamp((vLocal.x - uBandX.x) / max(uBandX.y - uBandX.x, 0.001), 0.0, 1.0);
    a *= clamp((uBandX.w - vLocal.x) / max(uBandX.w - uBandX.z, 0.001), 0.0, 1.0);
  }
  if (vLocal.y > uClip) a = 0.0;
  if (uBandY.z > 0.5) a *= max(0.0, 1.0 - abs(vLocal.y - uBandY.x) / uBandY.y);
  if (uFadeB.y > uFadeB.x) a *= clamp((uFadeB.y - vLocal.y) / (uFadeB.y - uFadeB.x), 0.0, 1.0);
  if (uFadeT.y > uFadeT.x) a *= clamp((vLocal.y - uFadeT.x) / (uFadeT.y - uFadeT.x), 0.0, 1.0);
  if (uFocus.w > 0.0) a *= smoothstep(uFocus.z, uFocus.w, distance(vScreen, uFocus.xy));
  if (a <= 0.0) discard;
  vec4 c = texture2D(uTex, vUv);
  c = vec4(c.rgb * uGain, c.a);
  if (uOverOn > 0.0) {
    float o = uOverOn;
    if (uOverFocus.w > 0.0) o *= smoothstep(uOverFocus.z, uOverFocus.w, distance(vScreen, uOverFocus.xy));
    if (uOverFadeB.y > uOverFadeB.x) o *= clamp((uOverFadeB.y - vLocal.y) / (uOverFadeB.y - uOverFadeB.x), 0.0, 1.0);
    if (uOverFadeT.y > uOverFadeT.x) o *= clamp((vLocal.y - uOverFadeT.x) / (uOverFadeT.y - uOverFadeT.x), 0.0, 1.0);
    // The overlay replaces this layer's colour inside its coverage (c is
    // premultiplied): what blending it over the result would give, in one pass.
    vec3 over = texture2D(uOver, vOverUv).rgb * uOverGain * c.a;
    c.rgb = mix(c.rgb, over, o);
  }
  gl_FragColor = c * a;
}`;

/* Layers without masks or overlay (most of the plate): one fetch per fragment. */
const FS_PLAIN = `${PRECISION}
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAlpha;
uniform float uGain;
void main() {
  vec4 c = texture2D(uTex, vUv);
  gl_FragColor = vec4(c.rgb * uGain, c.a) * uAlpha;
}`;

const VS_SHAPE = `
attribute vec2 aPos;
attribute vec2 aUv;
attribute vec4 aColor;
attribute float aKind;
uniform vec4 uCam;
uniform vec2 uView;
varying vec2 vUv;
varying vec4 vColor;
varying float vKind;
void main() {
  vec2 s = (aPos - uCam.xy) * uCam.z + 0.5 * uView;
  vUv = aUv;
  vColor = aColor;
  vKind = aKind;
  gl_Position = vec4(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0, 0.0, 1.0);
}`;

/* kind 0: line (soft edges across u), 1: disk, 2: linear radial falloff,
   3: three-stop radial gradient from uniforms. Colours are straight alpha. */
const FS_SHAPE = `${PRECISION}
varying vec2 vUv;
varying vec4 vColor;
varying float vKind;
uniform vec4 uC0;
uniform vec4 uC1;
uniform vec4 uC2;
uniform float uMid;
void main() {
  vec4 c = vColor;
  float r = length(vUv);
  if (vKind < 0.5) c.a *= 1.0 - smoothstep(0.45, 1.0, abs(vUv.x));
  else if (vKind < 1.5) c.a *= 1.0 - smoothstep(0.55, 1.0, r);
  else if (vKind < 2.5) c.a *= max(0.0, 1.0 - r);
  else {
    float t = clamp(r, 0.0, 1.0);
    vec4 g = t < uMid ? mix(uC0, uC1, t / uMid) : mix(uC1, uC2, (t - uMid) / (1.0 - uMid));
    c = vec4(g.rgb, g.a * c.a);
  }
  if (c.a <= 0.0) discard;
  gl_FragColor = vec4(c.rgb * c.a, c.a);
}`;

interface Tile {
  key: string;
  layer: PhoneLayer;
  r: number;
  c: number;
  state: "idle" | "loading" | "decoded" | "ready";
  bitmap?: ImageBitmap | HTMLImageElement;
  tex?: WebGLTexture;
  bytes: number;
  readyAt: number;
  wantedAt: number;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const attrs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "default",
  };
  const gl2 = canvas.getContext("webgl2", attrs);
  const gl = (gl2 ?? canvas.getContext("webgl", attrs)) as
    WebGL2RenderingContext | WebGLRenderingContext | null;
  if (!gl) return null;
  const webgl2 = Boolean(gl2);

  const G = phoneTiles.gutter;
  const L = phoneTiles.layers as unknown as Record<LayerName, PhoneLayer>;

  let lost = false;
  let vw = 390;
  let vh = 844;
  let dpr = 1;
  let cam: Cam = { cx: 0, cy: 0, d: 1 };
  let clock = 0;
  let listener: (() => void) | null = null;

  /* ------------------------------------------------------------ programs */
  interface Programs {
    layer: WebGLProgram;
    plain: WebGLProgram;
    shape: WebGLProgram;
    quad: WebGLBuffer;
    dyn: WebGLBuffer;
    blank: WebGLTexture;
    u: Record<string, WebGLUniformLocation | null>;
    p: Record<string, WebGLUniformLocation | null>;
    s: Record<string, WebGLUniformLocation | null>;
  }
  let P: Programs | null = null;

  function compile(type: number, source: string) {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS) && !gl!.isContextLost())
      throw new Error(gl!.getShaderInfoLog(shader) ?? "shader");
    return shader;
  }
  function link(vs: string, fs: string) {
    const program = gl!.createProgram()!;
    gl!.attachShader(program, compile(gl!.VERTEX_SHADER, vs));
    gl!.attachShader(program, compile(gl!.FRAGMENT_SHADER, fs));
    // Fixed attribute slots shared by all programs.
    ["aUnit", "aUv", "aColor", "aKind"].forEach((name, i) =>
      gl!.bindAttribLocation(program, i, name),
    );
    gl!.bindAttribLocation(program, 0, "aPos");
    gl!.linkProgram(program);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS) && !gl!.isContextLost())
      throw new Error(gl!.getProgramInfoLog(program) ?? "program");
    return program;
  }
  function setup() {
    const layer = link(VS_LAYER, FS_LAYER);
    const plain = link(VS_LAYER, FS_PLAIN);
    const shape = link(VS_SHAPE, FS_SHAPE);
    const quad = gl!.createBuffer()!;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.bufferData(
      gl!.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl!.STATIC_DRAW,
    );
    const dyn = gl!.createBuffer()!;
    const blank = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, blank);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA,
      1,
      1,
      0,
      gl!.RGBA,
      gl!.UNSIGNED_BYTE,
      new Uint8Array([14, 17, 24, 255]),
    );
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    const names = (program: WebGLProgram, list: string[]) =>
      Object.fromEntries(list.map((n) => [n, gl!.getUniformLocation(program, n)]));
    P = {
      layer,
      plain,
      shape,
      quad,
      dyn,
      blank,
      u: names(layer, [
        "uRect",
        "uUv",
        "uCam",
        "uView",
        "uTex",
        "uAlpha",
        "uBandX",
        "uClip",
        "uBandY",
        "uFadeB",
        "uFadeT",
        "uFocus",
        "uGain",
        "uOver",
        "uOverMap",
        "uOverOn",
        "uOverFocus",
        "uOverFadeB",
        "uOverFadeT",
        "uOverGain",
      ]),
      p: names(plain, ["uRect", "uUv", "uCam", "uView", "uTex", "uAlpha", "uGain"]),
      s: names(shape, ["uCam", "uView", "uC0", "uC1", "uC2", "uMid"]),
    };
    gl!.disable(gl!.DEPTH_TEST);
    gl!.enable(gl!.BLEND);
  }
  setup();

  /* ------------------------------------------------------------ tiles */
  const tiles = new Map<string, Tile>();
  /** Tiles whose request failed, and when: retried after RETRY_MS. */
  const failed = new Map<string, number>();
  let bytes = 0;
  let loading = 0;
  const queue: Tile[] = [];
  let wanted = new Set<string>();
  let wantedOrder: readonly string[] = [];
  /** Start loads for wanted tiles, most urgent first, up to MAX_LOADS at once. */
  function kick() {
    for (const key of wantedOrder) {
      if (loading >= MAX_LOADS) break;
      const tile = tileOf(key);
      if (tile.state === "idle") load(tile);
    }
  }

  const tileOf = (key: string): Tile => {
    let tile = tiles.get(key);
    if (!tile) {
      const [name, rc] = key.split("/") as [LayerName, string];
      const [r, c] = rc.split("-").map(Number) as [number, number];
      const layer = L[name];
      tile = { key, layer, r, c, state: "idle", bytes: 0, readyAt: 0, wantedAt: 0 };
      tiles.set(key, tile);
    }
    return tile;
  };
  const urlOf = (tile: Tile) =>
    tile.layer.name === "preview"
      ? `${phoneTiles.base}preview.webp`
      : `${phoneTiles.base}${tile.layer.name}/${tile.r}-${tile.c}.webp`;

  async function decode(url: string): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === "function") {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        return await createImageBitmap(blob, {
          premultiplyAlpha: "premultiply",
          colorSpaceConversion: "default",
        });
      } catch {
        /* fall through to an <img> */
      }
    }
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  }
  function load(tile: Tile) {
    tile.state = "loading";
    loading++;
    decode(urlOf(tile))
      .then((bitmap) => {
        loading--;
        if (disposed || tile.state !== "loading") {
          if ("close" in bitmap) bitmap.close();
          return;
        }
        tile.bitmap = bitmap;
        tile.state = "decoded";
        queue.push(tile);
        kick();
        listener?.();
      })
      .catch(() => {
        loading--;
        // Leave it for a later want(); keep the others coming.
        tile.state = "idle";
        failed.set(tile.key, performance.now());
        kick();
      });
  }
  function release(tile: Tile) {
    if (tile.tex && !lost) gl!.deleteTexture(tile.tex);
    if (tile.bitmap && "close" in tile.bitmap) tile.bitmap.close();
    tile.tex = undefined;
    tile.bitmap = undefined;
    bytes -= tile.bytes;
    tile.bytes = 0;
    tile.state = "idle";
  }
  function upload(tile: Tile) {
    const bitmap = tile.bitmap!;
    const tex = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, bitmap);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    if (webgl2) {
      gl!.generateMipmap(gl!.TEXTURE_2D);
      gl!.texParameteri(
        gl!.TEXTURE_2D,
        gl!.TEXTURE_MIN_FILTER,
        gl!.LINEAR_MIPMAP_LINEAR,
      );
    } else {
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    }
    const w = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
    const h = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;
    tile.bytes = Math.round(w * h * 4 * (webgl2 ? 4 / 3 : 1));
    bytes += tile.bytes;
    if ("close" in bitmap) bitmap.close();
    tile.bitmap = undefined;
    tile.tex = tex;
    tile.state = "ready";
    // A tile that arrives while its area is on screen fades in; one that was
    // uploaded ahead of the camera is simply there.
    tile.readyAt = performance.now();
  }
  /** Decoded size of a tile's texture (with its mipmaps). */
  function sizeOf(tile: Tile) {
    const layer = tile.layer;
    if (layer.name === "preview") return layer.texW * layer.texH * 4;
    const T = layer.tile;
    const w = Math.min(T, layer.texW - tile.c * T) + 2 * G;
    const h = Math.min(T, layer.texH - tile.r * T) + 2 * G;
    return Math.round(w * h * 4 * (webgl2 ? 4 / 3 : 1));
  }
  function evict() {
    if (bytes <= BUDGET) return;
    const candidates = [...tiles.values()]
      .filter(
        (t) => t.state === "ready" && !wanted.has(t.key) && t.layer.name !== "preview",
      )
      .sort((a, b) => a.wantedAt - b.wantedAt);
    for (const tile of candidates) {
      if (bytes <= BUDGET * 0.85) break;
      release(tile);
    }
  }

  /* ------------------------------------------------------------ drawing */
  function quadUniforms(
    tile: Tile,
    rect: Rect,
    u: Record<string, WebGLUniformLocation | null>,
  ) {
    const layer = tile.layer;
    const T = layer.tile;
    const tw =
      layer.name === "preview"
        ? layer.texW
        : Math.min(T, layer.texW - tile.c * T) + 2 * G;
    const th =
      layer.name === "preview"
        ? layer.texH
        : Math.min(T, layer.texH - tile.r * T) + 2 * G;
    const g = layer.name === "preview" ? 0 : G;
    // texel (0,0) of this tile's texture, in the scaled layer's texel grid
    const tx = tile.c * T - g;
    const ty = tile.r * T - g;
    const u0 = ((rect.x0 - layer.x) * layer.sx - tx) / tw;
    const v0 = ((rect.y0 - layer.y) * layer.sy - ty) / th;
    const du = ((rect.x1 - rect.x0) * layer.sx) / tw;
    const dv = ((rect.y1 - rect.y0) * layer.sy) / th;
    gl!.uniform4f(u.uRect!, rect.x0, rect.y0, rect.x1 - rect.x0, rect.y1 - rect.y0);
    gl!.uniform4f(u.uUv!, u0, v0, du, dv);
  }
  function tileRect(tile: Tile): Rect {
    const layer = tile.layer;
    if (layer.name === "preview")
      return { x0: layer.x, y0: layer.y, x1: layer.x + layer.w, y1: layer.y + layer.h };
    const T = layer.tile;
    const x0 = layer.x + (tile.c * T) / layer.sx;
    const y0 = layer.y + (tile.r * T) / layer.sy;
    const x1 = Math.min(layer.x + layer.w, layer.x + ((tile.c + 1) * T) / layer.sx);
    const y1 = Math.min(layer.y + layer.h, layer.y + ((tile.r + 1) * T) / layer.sy);
    return { x0, y0, x1, y1 };
  }
  const view = (): Rect => ({
    x0: cam.cx - (vw * cam.d) / 2,
    x1: cam.cx + (vw * cam.d) / 2,
    y0: cam.cy - (vh * cam.d) / 2,
    y1: cam.cy + (vh * cam.d) / 2,
  });
  function tilesOf(name: LayerName, rect: Rect): string[] {
    const layer = L[name];
    if (name === "preview") return ["preview/0-0"];
    const x0 = Math.max(rect.x0, layer.x);
    const x1 = Math.min(rect.x1, layer.x + layer.w);
    const y0 = Math.max(rect.y0, layer.y);
    const y1 = Math.min(rect.y1, layer.y + layer.h);
    if (x1 <= x0 || y1 <= y0) return [];
    const T = layer.tile;
    const c0 = Math.max(0, Math.floor(((x0 - layer.x) * layer.sx) / T));
    const c1 = Math.min(
      layer.cols - 1,
      Math.floor(((x1 - layer.x) * layer.sx - 1e-6) / T),
    );
    const r0 = Math.max(0, Math.floor(((y0 - layer.y) * layer.sy) / T));
    const r1 = Math.min(
      layer.rows - 1,
      Math.floor(((y1 - layer.y) * layer.sy - 1e-6) / T),
    );
    const keys: string[] = [];
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) keys.push(`${name}/${r}-${c}`);
    return keys;
  }

  /** Every base tile under `rect` is uploaded and fully faded in. */
  function covered(rect: Rect) {
    const now = performance.now();
    const keys = tilesOf("base", rect);
    if (rect.y0 < 0) keys.push(...tilesOf("sky", rect));
    return keys.every((key) => {
      const tile = tiles.get(key);
      return tile?.state === "ready" && now - tile.readyAt >= FADE_MS;
    });
  }
  let fadingNow = false;
  function bindLayerProgram(variant: "full" | "plain") {
    const U = variant === "full" ? P!.u : P!.p;
    gl!.useProgram(variant === "full" ? P!.layer : P!.plain);
    for (const a of [1, 2, 3]) gl!.disableVertexAttribArray(a);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, P!.quad);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
    gl!.uniform4f(U.uCam!, cam.cx, cam.cy, 1 / cam.d, 0);
    gl!.uniform2f(U.uView!, vw, vh);
    gl!.uniform1i(U.uTex!, 0);
    if (variant === "full") gl!.uniform1i(U.uOver!, 1);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    program = variant;
  }
  let program: "full" | "plain" | "shape" | null = null;

  const renderer: Renderer = {
    webgl2,
    resize(w, h, ratio) {
      vw = w;
      vh = h;
      dpr = ratio;
      const W = Math.max(1, Math.round(w * ratio));
      const H = Math.max(1, Math.round(h * ratio));
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
    },
    want(keys) {
      clock++;
      // Most urgent first, cut where the budget ends: look-ahead never pushes
      // what is on screen (or the decoded total) past BUDGET.
      let total = 0;
      const kept: string[] = [];
      for (const key of keys) {
        const size = sizeOf(tileOf(key));
        if (total + size > BUDGET && kept.length) break;
        total += size;
        kept.push(key);
      }
      wanted = new Set(kept);
      const now = performance.now();
      wantedOrder = kept.filter(
        (key) => now - (failed.get(key) ?? -RETRY_MS) >= RETRY_MS,
      );
      for (const key of kept) tileOf(key).wantedAt = clock;
      kick();
      evict();
    },
    tilesOf,
    has(keys) {
      return keys.every((key) => tiles.get(key)?.state === "ready");
    },
    fading() {
      return fadingNow;
    },
    settle() {
      for (const tile of tiles.values()) if (tile.state === "ready") tile.readyAt = 0;
    },
    veil(alpha) {
      if (lost || alpha <= 0.002) return;
      if (program !== "plain") bindLayerProgram("plain");
      const u = P!.p;
      const win = view();
      gl!.uniform4f(u.uRect!, win.x0, win.y0, win.x1 - win.x0, win.y1 - win.y0);
      gl!.uniform4f(u.uUv!, 0, 0, 1, 1);
      gl!.uniform1f(u.uAlpha!, Math.min(1, alpha));
      gl!.uniform1f(u.uGain!, 1);
      gl!.bindTexture(gl!.TEXTURE_2D, P!.blank);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    },
    begin(c) {
      cam = c;
      fadingNow = false;
      if (lost) return;
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.clearColor(14 / 255, 17 / 255, 24 / 255, 1);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      program = null;
    },
    layer(draw) {
      if (lost || draw.alpha <= 0.002) return;
      // The preview only shows through where a base tile is still missing.
      if (draw.layer === "preview" && covered(view())) return;
      const win = view();
      const now = performance.now();
      // The overlay (one texture) on unit 1, or the 1×1 placeholder.
      const over = draw.over && draw.over.alpha > 0.002 ? draw.over : undefined;
      const overTile = over ? tiles.get(`${over.layer}/0-0`) : undefined;
      const overReady = overTile?.state === "ready" ? overTile : undefined;
      const plain =
        !overReady &&
        !draw.bandX &&
        draw.clipBottom === undefined &&
        !draw.bandY &&
        !draw.fadeBottom &&
        !draw.fadeTop &&
        !draw.focus;
      const variant = plain ? "plain" : "full";
      if (program !== variant) bindLayerProgram(variant);
      const u = plain ? P!.p : P!.u;
      if (!plain) {
        gl!.activeTexture(gl!.TEXTURE1);
        gl!.bindTexture(gl!.TEXTURE_2D, overReady?.tex ?? P!.blank);
        gl!.activeTexture(gl!.TEXTURE0);
      }
      if (plain) {
        /* no masks */
      } else if (overReady) {
        const ol = overReady.layer;
        gl!.uniform4f(
          u.uOverMap!,
          ol.x - G / ol.sx,
          ol.y - G / ol.sy,
          ol.sx / (ol.texW + 2 * G),
          ol.sy / (ol.texH + 2 * G),
        );
        gl!.uniform1f(u.uOverGain!, over!.gain ?? 1);
      } else gl!.uniform1f(u.uOverOn!, 0);
      for (const key of tilesOf(draw.layer, win)) {
        const tile = tiles.get(key);
        if (!tile || tile.state !== "ready") continue;
        const rect = tileRect(tile);
        // clip the quad to the camera window (fewer fragments)
        const q: Rect = {
          x0: Math.max(rect.x0, win.x0 - 2 * cam.d),
          y0: Math.max(rect.y0, win.y0 - 2 * cam.d),
          x1: Math.min(rect.x1, win.x1 + 2 * cam.d),
          y1: Math.min(rect.y1, win.y1 + 2 * cam.d),
        };
        if (q.x1 <= q.x0 || q.y1 <= q.y0) continue;
        const fade = Math.min(1, (now - tile.readyAt) / FADE_MS);
        if (fade < 1) fadingNow = true;
        quadUniforms(tile, q, u);
        gl!.uniform1f(u.uAlpha!, draw.alpha * (draw.layer === "preview" ? 1 : fade));
        gl!.uniform1f(u.uGain!, draw.gain ?? 1);
        if (plain) {
          gl!.bindTexture(gl!.TEXTURE_2D, tile.tex!);
          gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
          continue;
        }
        const bx = draw.bandX;
        if (bx)
          gl!.uniform4f(
            u.uBandX!,
            bx[0] - q.x0,
            bx[1] - q.x0,
            bx[2] - q.x0,
            bx[3] - q.x0,
          );
        else gl!.uniform4f(u.uBandX!, 0, 0, 0, 0);
        gl!.uniform1f(
          u.uClip!,
          draw.clipBottom === undefined ? 60000 : draw.clipBottom - q.y0,
        );
        const by = draw.bandY;
        if (by) gl!.uniform3f(u.uBandY!, by[0] - q.y0, by[1], 1);
        else gl!.uniform3f(u.uBandY!, 0, 1, 0);
        const fb = draw.fadeBottom;
        if (fb) gl!.uniform2f(u.uFadeB!, fb[0] - q.y0, fb[1] - q.y0);
        else gl!.uniform2f(u.uFadeB!, 0, 0);
        const ft = draw.fadeTop;
        if (ft) gl!.uniform2f(u.uFadeT!, ft[0] - q.y0, ft[1] - q.y0);
        else gl!.uniform2f(u.uFadeT!, 0, 0);
        const f = draw.focus;
        if (f) gl!.uniform4f(u.uFocus!, f[0], f[1], f[2], f[3]);
        else gl!.uniform4f(u.uFocus!, 0, 0, 0, 0);
        if (overReady) {
          const o = over!;
          gl!.uniform1f(u.uOverOn!, o.alpha);
          const of = o.focus;
          if (of) gl!.uniform4f(u.uOverFocus!, of[0], of[1], of[2], of[3]);
          else gl!.uniform4f(u.uOverFocus!, 0, 0, 0, 0);
          const ob = o.fadeBottom;
          if (ob) gl!.uniform2f(u.uOverFadeB!, ob[0] - q.y0, ob[1] - q.y0);
          else gl!.uniform2f(u.uOverFadeB!, 0, 0);
          const ot = o.fadeTop;
          if (ot) gl!.uniform2f(u.uOverFadeT!, ot[0] - q.y0, ot[1] - q.y0);
          else gl!.uniform2f(u.uOverFadeT!, 0, 0);
        }
        gl!.bindTexture(gl!.TEXTURE_2D, tile.tex!);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      }
    },
    glow(glow) {
      if (lost || glow.alpha <= 0.004) return;
      const s = P!.s;
      gl!.useProgram(P!.shape);
      program = "shape";
      gl!.uniform4f(s.uCam!, cam.cx, cam.cy, 1 / cam.d, 0);
      gl!.uniform2f(s.uView!, vw, vh);
      const [c0, c1, c2] = [
        glow.stops[0]!,
        glow.stops[1]!,
        glow.stops[2] ?? glow.stops[1]!,
      ];
      gl!.uniform4f(s.uC0!, c0[0] / 255, c0[1] / 255, c0[2] / 255, c0[3]);
      gl!.uniform4f(s.uC1!, c1[0] / 255, c1[1] / 255, c1[2] / 255, c1[3]);
      gl!.uniform4f(s.uC2!, c2[0] / 255, c2[1] / 255, c2[2] / 255, c2[3]);
      gl!.uniform1f(s.uMid!, glow.mid);
      const { x, y, rx, ry, alpha } = glow;
      const v = new Float32Array([
        x - rx,
        y - ry,
        -1,
        -1,
        1,
        1,
        1,
        alpha,
        3,
        x + rx,
        y - ry,
        1,
        -1,
        1,
        1,
        1,
        alpha,
        3,
        x - rx,
        y + ry,
        -1,
        1,
        1,
        1,
        1,
        alpha,
        3,
        x + rx,
        y + ry,
        1,
        1,
        1,
        1,
        1,
        alpha,
        3,
      ]);
      gl!.blendFunc(
        gl!.ONE,
        glow.screen ? gl!.ONE_MINUS_SRC_COLOR : gl!.ONE_MINUS_SRC_ALPHA,
      );
      bindShape(v);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    },
    shapes(vertices, count) {
      if (lost || count === 0) return;
      const s = P!.s;
      gl!.useProgram(P!.shape);
      program = "shape";
      gl!.uniform4f(s.uCam!, cam.cx, cam.cy, 1 / cam.d, 0);
      gl!.uniform2f(s.uView!, vw, vh);
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      bindShape(vertices.subarray(0, count * 9));
      gl!.drawArrays(gl!.TRIANGLES, 0, count);
    },
    end() {
      if (lost) return;
      for (const a of [0, 1, 2, 3]) gl!.disableVertexAttribArray(a);
      program = null;
    },
    pump() {
      if (lost || !queue.length) return false;
      const t0 = performance.now();
      let changed = false;
      while (queue.length && performance.now() - t0 < UPLOAD_BUDGET_MS) {
        const tile = queue.shift()!;
        if (tile.state !== "decoded") continue;
        upload(tile);
        changed = true;
      }
      evict();
      return changed;
    },
    stats() {
      return {
        bytes,
        tiles: [...tiles.values()].filter((t) => t.state === "ready").length,
        loading,
        queued: queue.length,
      };
    },
    onChange(fn) {
      listener = fn;
    },
    dispose() {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      for (const tile of tiles.values()) release(tile);
      tiles.clear();
      if (P && !lost) {
        gl!.deleteProgram(P.layer);
        gl!.deleteProgram(P.plain);
        gl!.deleteProgram(P.shape);
        gl!.deleteBuffer(P.quad);
        gl!.deleteBuffer(P.dyn);
        gl!.deleteTexture(P.blank);
      }
      P = null;
    },
  };
  let disposed = false;

  function bindShape(data: Float32Array) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, P!.dyn);
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.DYNAMIC_DRAW);
    const stride = 9 * 4;
    // slots: 0 aPos, 1 aUv, 2 aColor, 3 aKind (bound at link time)
    const layout: [number, number, number][] = [
      [0, 2, 0],
      [1, 2, 8],
      [2, 4, 16],
      [3, 1, 32],
    ];
    for (const [slot, size, offset] of layout) {
      gl!.enableVertexAttribArray(slot);
      gl!.vertexAttribPointer(slot, size, gl!.FLOAT, false, stride, offset);
    }
  }

  /* ------------------------------------------------------------ context loss */
  function onLost(event: Event) {
    event.preventDefault();
    lost = true;
    for (const tile of tiles.values()) {
      tile.tex = undefined;
      if (tile.state === "ready") tile.state = "idle";
      if (tile.state === "decoded") {
        if (tile.bitmap && "close" in tile.bitmap) tile.bitmap.close();
        tile.bitmap = undefined;
        tile.state = "idle";
      }
    }
    queue.length = 0;
    bytes = 0;
    for (const tile of tiles.values()) tile.bytes = 0;
  }
  function onRestored() {
    lost = false;
    setup();
    listener?.();
  }
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  void dpr;
  return renderer;
}
