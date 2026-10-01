/**
 * WebGL2 renderers of HOME, ported from the adopted prototype's `gl.js`
 * (home-r3-2026-10-02 / home-r3-mobile-2026-10-02, author Opus 5.5).
 *
 * - Panorama (課題から探す): the lakeside-path panorama with a depth map. The
 *   camera trucks along it with depth parallax, pushes in at each place, and
 *   small regions breathe (steam, bath water, the noren).
 * - Lake (支援の進め方): a still back layer (sky and the great peak, with
 *   alpenglow and sunlight descending it) behind crop-zoomed front plates; the
 *   six step names are textured planes in a perspective world aligned with the
 *   photograph's shoreline; an orange route runs on the water between them.
 *
 * Production differences from the prototype, none of which change a pixel the
 * prototype drew:
 * - plates are the 2× redraws (UVs are resolution-independent);
 * - the panorama colour is split into textures no wider than 4096 px (phone
 *   GPUs), sampled with explicit gradients so the split never shows;
 * - the lake's back layer (P-1 and its two light variants) is cropped to the
 *   sky and the peak — rows the front plates never cover;
 * - the drawing buffer follows the device pixel ratio up to `dprCap`.
 */

const VS = `#version 300 es
in vec2 a; out vec2 vUv;
void main() { vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

type Uniforms = Record<string, WebGLUniformLocation | null>;
interface Program {
  readonly p: WebGLProgram;
  readonly u: Uniforms;
}

function createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    // drawn on demand from the scroll ticker; keeps the last frame for stills
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  if (!gl) throw new Error("WebGL2 unavailable");
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  return gl;
}

function program(gl: WebGL2RenderingContext, fs: string): Program {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, "a");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const u: Uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)!;
    u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

type Source = TexImageSource;

function texture(
  gl: WebGL2RenderingContext,
  src: Source,
  { mip = true }: { mip?: boolean } = {},
): WebGLTexture {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension("EXT_texture_filter_anisotropic");
  if (ext && mip) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  return t;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`load ${src}`));
    image.src = src;
  });
}

function fit(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, dprCap: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  return { w, h, dpr };
}

function bind(
  gl: WebGL2RenderingContext,
  unit: number,
  tex: WebGLTexture,
  loc: WebGLUniformLocation | null,
) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc, unit);
}

function draw(gl: WebGL2RenderingContext) {
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ———————————————————————————————————————————————————————— panorama (課題から探す)
const PANO_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uC0, uC1, uC2, uDepth, uMask;
uniform vec4 uSpan[3];    // per colour texture: x0, x1 (plate px it covers), selection start, selection end
uniform vec2 uRes;        // drawing buffer px
uniform vec2 uPano;       // panorama size, plate px
uniform vec2 uCenter;     // plate px shown at the screen centre
uniform float uScale;     // drawing-buffer px per plate px
uniform float uPar;       // parallax: buffer px shift of the nearest pixels (signed)
uniform float uRef;       // depth that does not move (0..1)
uniform float uPush;      // radial parallax about the screen centre
uniform float uTime;
uniform float uFade;      // 0..1 → ivory haze (exit into the founder's letter)
uniform float uDim;       // 0..1 overall darkening (entry)
${NOISE}
vec2 toPano(vec2 s) { return uCenter + (s - 0.5 * uRes) / uScale; }
vec3 colourAt(vec2 q, vec2 gx, vec2 gy) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec4 sp = uSpan[i];
    float w = step(sp.z, q.x) * (1.0 - step(sp.w, q.x));
    float span = sp.y - sp.x;
    vec2 uv = vec2((q.x - sp.x) / span, q.y / uPano.y);
    vec2 sx = vec2(gx.x / span, gx.y / uPano.y), sy = vec2(gy.x / span, gy.y / uPano.y);
    vec3 v = i == 0 ? textureGrad(uC0, uv, sx, sy).rgb : i == 1 ? textureGrad(uC1, uv, sx, sy).rgb : textureGrad(uC2, uv, sx, sy).rgb;
    c += v * w;
  }
  return c;
}
void main() {
  vec2 s = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = toPano(s);
  vec2 q = p;
  for (int i = 0; i < 3; i++) { float d = texture(uDepth, q / uPano).r; float k = 1.0 + uPush * (d - uRef); q = uCenter + (p - uCenter) / k - vec2(uPar * (d - uRef) / uScale, 0.0); }
  vec4 m = texture(uMask, q / uPano);
  float tt = uTime;
  q.x += m.b * (sin(tt * 1.1 + q.y * 0.018) * 2.6 + sin(tt * 0.63 + q.y * 0.041) * 1.2) * smoothstep(0.0, 1.0, m.b);
  q += m.g * vec2(sin(tt * 1.7 + q.y * 0.21 + q.x * 0.013), cos(tt * 1.3 + q.x * 0.17)) * 0.9;
  vec2 gx = dFdx(p), gy = dFdy(p);
  vec3 c = colourAt(clamp(q, vec2(0.0), uPano - 0.5), gx, gy);
  float st = fbm(q * vec2(0.010, 0.006) + vec2(0.0, tt * 0.09)) * fbm(q * 0.004 + vec2(tt * 0.02, tt * 0.05));
  c = mix(c, vec3(0.93, 0.92, 0.9), m.r * smoothstep(0.18, 0.62, st) * 0.42);
  vec2 uv = s / uRes;
  float vig = smoothstep(1.15, 0.35, length((uv - 0.5) * vec2(1.0, 1.25)));
  c *= mix(0.86, 1.0, vig);
  c *= 1.0 - uDim * 0.55;
  float haze = fbm(uv * vec2(3.0, 2.0) + vec2(tt * 0.03, 0.0));
  c = mix(c, vec3(0.945, 0.937, 0.918), smoothstep(0.0, 1.0, uFade * (0.75 + 0.5 * haze)));
  c += (hash(s + fract(tt) * 91.7) - 0.5) * 0.018;
  o = vec4(c, 1.0);
}`;

export interface PanoramaTile {
  readonly src: string;
  /** Plate-px columns this texture covers (with overlap), and the columns it is chosen for. */
  readonly x0: number;
  readonly x1: number;
  readonly use0: number;
  readonly use1: number;
}

export interface PanoramaState {
  readonly cx: number;
  readonly cy: number;
  readonly scale: number;
  readonly par: number;
  readonly ref: number;
  readonly push: number;
  readonly t: number;
  readonly fade: number;
  readonly dim: number;
}

export interface Renderer<S> {
  render(state: S): void;
  dispose(): void;
}

export async function createPanorama(
  canvas: HTMLCanvasElement,
  options: {
    tiles: readonly PanoramaTile[];
    depth: string;
    mask: HTMLCanvasElement;
    size: readonly [number, number];
    dprCap: number;
    mip: boolean;
  },
): Promise<Renderer<PanoramaState>> {
  const gl = createContext(canvas);
  const prog = program(gl, PANO_FS);
  const images = await Promise.all([
    ...options.tiles.map((t) => loadImage(t.src)),
    loadImage(options.depth),
  ]);
  const colours = images
    .slice(0, options.tiles.length)
    .map((im) => texture(gl, im, { mip: options.mip }));
  const depth = texture(gl, images[options.tiles.length]!, { mip: false });
  const mask = texture(gl, options.mask, { mip: false });
  const spans = options.tiles.flatMap((t) => [t.x0, t.x1, t.use0, t.use1]);
  while (spans.length < 12) spans.push(0, 1, 1e9, 1e9);
  return {
    render(st) {
      const { w, h, dpr } = fit(canvas, gl, options.dprCap);
      gl.useProgram(prog.p);
      [prog.u.uC0, prog.u.uC1, prog.u.uC2].forEach((loc, i) =>
        bind(gl, i, colours[Math.min(i, colours.length - 1)]!, loc),
      );
      bind(gl, 3, depth, prog.u.uDepth);
      bind(gl, 4, mask, prog.u.uMask);
      gl.uniform4fv(prog.u.uSpan!, spans);
      gl.uniform2f(prog.u.uRes!, w, h);
      gl.uniform2f(prog.u.uPano!, options.size[0], options.size[1]);
      gl.uniform2f(prog.u.uCenter!, st.cx, st.cy);
      gl.uniform1f(prog.u.uScale!, st.scale * dpr);
      gl.uniform1f(prog.u.uPar!, st.par * dpr);
      gl.uniform1f(prog.u.uRef!, st.ref);
      gl.uniform1f(prog.u.uPush!, st.push);
      gl.uniform1f(prog.u.uTime!, st.t);
      gl.uniform1f(prog.u.uFade!, st.fade);
      gl.uniform1f(prog.u.uDim!, st.dim);
      draw(gl);
    },
    dispose() {
      [...colours, depth, mask].forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(prog.p);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

// ———————————————————————————————————————————————————— the lake crossing (支援の進め方)
const LAKE_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
// back = P-1 (sky and the great peak) and its two light variants, cropped to the rows above the shore;
// front = RGBA plates whose alpha is the cedar-top matte, flown into by crop-zoom
uniform sampler2D uB0, uB1, uB2, uP0, uP1, uP2, uP3, uWords, uDepth3;
uniform float uBackRows;     // plate rows held by the cropped light variants
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uVP;            // vanishing point of the plates (zoom centre), CSS px
uniform vec2 uHz;            // principal point of the word world (on its horizon), CSS px
uniform float uBase;         // CSS px per plate px at zoom 1 (cover)
uniform float uZoom;         // zoom of the front layer
uniform float uZB;           // zoom of the back layer
uniform vec2 uAnchor[3];
uniform float uMag[3];
uniform vec2 uMix;
uniform float uGlow;
uniform float uSunB;
uniform float uSun;
uniform float uMist;
uniform vec3 uMistCol;
uniform float uTime;
uniform float uPaper;
uniform float uF;
uniform float uH;
uniform float uCamZ;
uniform vec4 uW0[6];
uniform vec4 uW1[6];
uniform vec4 uAtlas[6];
uniform vec4 uRoute;
uniform vec4 uRouteX;
${NOISE}
vec3 back(vec2 s) {
  vec2 p = uAnchor[0] + (s - uVP) / (uBase * uZB);
  vec2 uv = p / vec2(1536.0, 1024.0);
  vec2 uvc = p / vec2(1536.0, uBackRows);
  vec3 c = texture(uB0, uvc).rgb;
  float n = (fbm(uv * vec2(5.0, 3.0) + uTime * 0.03) - 0.5) * 0.05;
  float tg = mix(0.02, 0.55, uGlow);
  if (uGlow > 0.0) c = mix(c, texture(uB1, uvc).rgb, 1.0 - smoothstep(tg - 0.06, tg + 0.06, uv.y + n));
  float ts = mix(0.02, 0.62, uSunB);
  if (uSunB > 0.0) c = mix(c, texture(uB2, uvc).rgb, 1.0 - smoothstep(ts - 0.07, ts + 0.07, uv.y + n));
  return c;
}
vec4 front(int i, vec2 s) {
  vec2 a = uAnchor[i]; float m = uMag[i];
  vec2 p = a + (s - uVP) * m / (uBase * uZoom);
  vec2 uv = p / vec2(1536.0, 1024.0);
  if (i == 0) return texture(uP0, uv);
  if (i == 1) return texture(uP1, uv);
  vec4 a2 = texture(uP2, uv);
  if (uSun <= 0.0) return a2;
  vec3 b2 = texture(uP3, uv).rgb;
  float d = texture(uDepth3, uv).r;
  float far = 1.0 - d;
  float thr = 1.0 - uSun * 1.35;
  float n = (fbm(uv * 6.0 + uTime * 0.05) - 0.5) * 0.16;
  float k = smoothstep(thr - 0.1, thr + 0.1, far + n);
  return vec4(mix(a2.rgb, b2, k), a2.a);
}
vec4 wordAt(int i, vec3 ro, vec3 rd, out float tHit) {
  vec4 w0 = uW0[i], w1 = uW1[i];
  vec3 U = vec3(1.0, 0.0, 0.0);
  vec3 V = vec3(0.0, cos(w1.y), sin(w1.y));
  vec3 N = cross(U, V);
  vec3 P0 = vec3(w0.x, w0.y, w0.z);
  float dn = dot(rd, N);
  float dns = abs(dn) < 1e-5 ? 1e-5 : dn;
  float t = dot(P0 - ro, N) / dns;
  vec3 Q = ro + rd * t;
  float u = (Q.x - w0.x) / w0.w + 0.5;
  float v = dot(Q - P0, V) / w1.x;
  vec4 r = uAtlas[i];
  float lay = sin(w1.y);
  vec2 wob = vec2(sin(Q.z * 0.9 + uTime * 1.4) * 0.0025, sin(Q.x * 0.7 + uTime * 1.1) * 0.010) * lay;
  vec2 auv = vec2(mix(r.x, r.z, clamp(u, 0.0, 1.0)) + wob.x, mix(r.w, r.y, clamp(v, 0.0, 1.0)) + wob.y);
  vec2 gx = dFdx(auv), gy = dFdy(auv);
  float a = textureGrad(uWords, auv, gx, gy).a;
  bool ok = w1.z > 0.001 && abs(dn) >= 1e-5 && t > 0.0 && u >= 0.0 && u <= 1.0 && v >= 0.0 && v <= 1.0;
  tHit = ok ? t : 1e9;
  return ok ? vec4(w1.w, w1.z, a, 0.0) : vec4(0.0);
}
void main() {
  vec2 s = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  int ia = int(uMix.x);
  vec4 fr = front(ia, s);
  if (uMix.y > 0.0) fr = mix(fr, front(ia + 1, s), uMix.y);
  vec3 c = mix(back(s), fr.rgb, fr.a);
  vec3 ro = vec3(0.0, uH, uCamZ);
  vec3 rd = normalize(vec3((s.x - uHz.x) / uF, (uHz.y - s.y) / uF, 1.0));
  float tw = rd.y < 0.0 ? uH / -rd.y : 1e9;
  vec3 W = ro + rd * tw;
  if (rd.y < 0.0 && uRoute.w > 0.0) {
    float rx = uRouteX.x + uRouteX.y * sin(W.z * uRouteX.z + uRouteX.w);
    float dx = abs(W.x - rx);
    float px = fwidth(W.x) + 1e-4;
    float core = 1.0 - smoothstep(0.6, 1.6, dx / px);
    float glow = exp(-dx / (px * 6.0)) * 0.5;
    float vis = step(W.z, uRoute.x) * step(uCamZ + 2.0, W.z) * smoothstep(uCamZ + 2.0, uCamZ + 22.0, W.z);
    float far = exp(-(W.z - uCamZ) / 900.0);
    float front = mix(uRoute.y, uCamZ, uRoute.z);
    float hand = uRoute.z > 0.0 ? smoothstep(front - 15.0, front + 15.0, W.z) : 0.0;
    vec3 rc = mix(vec3(1.0, 0.494, 0.082), vec3(0.98, 0.96, 0.92), hand);
    c = mix(c, rc, clamp((core + glow) * vis * far * uRoute.w, 0.0, 1.0));
  }
  vec2 uv = s / (uRes / uDpr);
  float n1 = fbm(vec2(uv.x * 1.6 + uTime * 0.02, uv.y * 2.4) + uCamZ * 0.0011);
  float n2 = fbm(vec2(uv.x * 3.1 - uTime * 0.015, uv.y * 4.2) + 7.0 + uCamZ * 0.0018);
  float hy = uVP.y / (uRes.y / uDpr);
  float band = exp(-pow((uv.y - hy) * 5.0, 2.0));
  float prof = mix(0.42, 1.0, smoothstep(hy - 0.3, hy + 0.05, uv.y));
  float bank = uMist * prof * (0.62 + 0.38 * smoothstep(0.25, 0.75, n1 * 0.55 + n2 * 0.45));
  float mist = clamp(band * 0.16 * smoothstep(0.35, 0.8, n1) + bank, 0.0, 0.96);
  c = mix(c, uMistCol, mist);
  float vig = smoothstep(1.2, 0.3, length((uv - 0.5) * vec2(1.0, 1.3)));
  c *= mix(0.84, 1.0, vig);
  float pe = 1.0 - uPaper;
  float pn = fbm(vec2(uv.x * 3.0, uTime * 0.05)) * 0.06;
  float paperAmt = 1.0 - smoothstep(pe - 0.1, pe + 0.06, uv.y + pn);
  c = mix(c, vec3(0.945, 0.937, 0.918), paperAmt);
  if (rd.y < 0.0) {
    vec3 rr = vec3(rd.x, -rd.y, rd.z);
    vec3 rro = W + vec3(sin(W.z * 0.8 + uTime) * 0.15, 0.0, 0.0);
    for (int i = 0; i < 6; i++) {
      if (sin(uW1[i].y) > 0.9) continue;
      float th; vec4 h = wordAt(i, rro, rr, th);
      if (h.z <= 0.0) continue;
      c = mix(c, c * 0.7 + 0.12, h.z * h.y * 0.35 * (1.0 - sin(uW1[i].y)) * (1.0 - paperAmt));
    }
  }
  vec3 ink = vec3(0.122, 0.165, 0.267);
  for (int i = 0; i < 6; i++) {
    float th;
    vec4 h = wordAt(i, ro, rd, th);
    if (h.z <= 0.0) continue;
    if (th > tw + 0.05) continue;
    float lay = sin(uW1[i].y);
    float far = mix(1.0, exp(-max(0.0, th - 40.0) / 700.0), max(lay, smoothstep(320.0, 700.0, uW0[i].z)));
    vec3 lightCol = mix(vec3(0.99, 0.97, 0.92), vec3(1.0, 0.86, 0.66), h.x);
    vec3 col = mix(ink, lightCol, smoothstep(0.25, 0.85, lay));
    float al = h.z * h.y * far * (1.0 - mist * 0.85 * lay);
    c = mix(c, c * 0.72, al * 0.35 * lay);
    c = mix(c, col, al * mix(1.0, 0.92, lay));
  }
  c += (hash(s + fract(uTime) * 91.7) - 0.5) * 0.016;
  o = vec4(c, 1.0);
}`;

export interface WordRect {
  readonly u0: number;
  readonly v0: number;
  readonly u1: number;
  readonly v1: number;
}

/** The six step names drawn once into an atlas (one row each) with the page's serif. */
function wordAtlas(words: readonly string[], font: string, spacingEm = 0.04) {
  const size = 240;
  const rowH = 400;
  const pad = 30;
  const canvas = document.createElement("canvas");
  const probe = canvas.getContext("2d")!;
  probe.font = `500 ${size}px ${font}`;
  probe.letterSpacing = `${spacingEm * size}px`;
  const widths = words.map((w) => probe.measureText(w).width);
  canvas.width = Math.ceil(Math.max(...widths) + pad * 2);
  canvas.height = rowH * words.length;
  const c = canvas.getContext("2d")!;
  c.font = `500 ${size}px ${font}`;
  c.letterSpacing = `${spacingEm * size}px`;
  c.fillStyle = "#ffffff";
  c.textBaseline = "alphabetic";
  const rects: WordRect[] = words.map((w, i) => {
    const m = c.measureText(w);
    const baseline = i * rowH + 20 + m.fontBoundingBoxAscent;
    c.fillText(w, pad, baseline);
    const top = baseline - m.fontBoundingBoxAscent;
    const bottom = baseline + m.fontBoundingBoxDescent;
    return {
      u0: pad / canvas.width,
      v0: top / canvas.height,
      u1: (pad + m.width) / canvas.width,
      v1: bottom / canvas.height,
    };
  });
  return { canvas, rects };
}

export interface LakeState {
  readonly vp: readonly [number, number];
  readonly hz: readonly [number, number];
  readonly base: number;
  readonly zoom: number;
  readonly zb: number;
  readonly anchors: readonly (readonly [number, number])[];
  readonly mags: readonly number[];
  readonly mix: readonly [number, number];
  readonly glow: number;
  readonly sunB: number;
  readonly sun: number;
  readonly mist: number;
  readonly mistCol: readonly number[];
  readonly t: number;
  readonly paper: number;
  readonly f: number;
  readonly h: number;
  readonly camZ: number;
  readonly w0: readonly (readonly number[])[];
  readonly w1: readonly (readonly number[])[];
  readonly route: readonly number[];
  readonly routeX: readonly number[];
}

export async function createLake(
  canvas: HTMLCanvasElement,
  options: {
    /** P-1, P-1g and P-1s, cropped to the top `backRows` plate rows. */
    back: readonly [string, string, string];
    backRows: number;
    /** P-1F, P-2F, P-3F, P-3LF (RGBA). */
    front: readonly [string, string, string, string];
    depth: string;
    words: readonly string[];
    font: string;
    dprCap: number;
    mip: boolean;
  },
): Promise<Renderer<LakeState>> {
  const gl = createContext(canvas);
  const prog = program(gl, LAKE_FS);
  const images = await Promise.all(
    [...options.back, ...options.front, options.depth].map(loadImage),
  );
  const tb = images.slice(0, 3).map((im) => texture(gl, im, { mip: options.mip }));
  const tp = images.slice(3, 7).map((im) => texture(gl, im, { mip: options.mip }));
  const td = texture(gl, images[7]!, { mip: false });
  const atlas = wordAtlas(options.words, options.font);
  const tw = texture(gl, atlas.canvas);
  const atlasRects = atlas.rects.flatMap((r) => [r.u0, r.v0, r.u1, r.v1]);
  return {
    render(st) {
      const { w, h, dpr } = fit(canvas, gl, options.dprCap);
      gl.useProgram(prog.p);
      [prog.u.uB0, prog.u.uB1, prog.u.uB2].forEach((loc, i) =>
        bind(gl, i, tb[i]!, loc!),
      );
      [prog.u.uP0, prog.u.uP1, prog.u.uP2, prog.u.uP3].forEach((loc, i) =>
        bind(gl, 3 + i, tp[i]!, loc!),
      );
      bind(gl, 7, tw, prog.u.uWords!);
      bind(gl, 8, td, prog.u.uDepth3!);
      gl.uniform1f(prog.u.uBackRows!, options.backRows);
      gl.uniform2f(prog.u.uRes!, w, h);
      gl.uniform1f(prog.u.uDpr!, dpr);
      gl.uniform2f(prog.u.uVP!, st.vp[0], st.vp[1]);
      gl.uniform2f(prog.u.uHz!, st.hz[0], st.hz[1]);
      gl.uniform1f(prog.u.uBase!, st.base);
      gl.uniform1f(prog.u.uZoom!, st.zoom);
      gl.uniform1f(prog.u.uZB!, st.zb);
      gl.uniform2fv(prog.u.uAnchor!, st.anchors.flat());
      gl.uniform1fv(prog.u.uMag!, st.mags);
      gl.uniform2f(prog.u.uMix!, st.mix[0], st.mix[1]);
      gl.uniform1f(prog.u.uGlow!, st.glow);
      gl.uniform1f(prog.u.uSunB!, st.sunB);
      gl.uniform1f(prog.u.uSun!, st.sun);
      gl.uniform1f(prog.u.uMist!, st.mist);
      gl.uniform3fv(prog.u.uMistCol!, st.mistCol);
      gl.uniform1f(prog.u.uTime!, st.t);
      gl.uniform1f(prog.u.uPaper!, st.paper);
      gl.uniform1f(prog.u.uF!, st.f);
      gl.uniform1f(prog.u.uH!, st.h);
      gl.uniform1f(prog.u.uCamZ!, st.camZ);
      gl.uniform4fv(prog.u.uW0!, st.w0.flat());
      gl.uniform4fv(prog.u.uW1!, st.w1.flat());
      gl.uniform4fv(prog.u.uAtlas!, atlasRects);
      gl.uniform4fv(prog.u.uRoute!, st.route);
      gl.uniform4fv(prog.u.uRouteX!, st.routeX);
      draw(gl);
    },
    dispose() {
      [...tb, ...tp, td, tw].forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(prog.p);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
