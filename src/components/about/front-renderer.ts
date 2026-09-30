/**
 * The implementation front (spec §8 M3): one WebGL quad that shows the ink
 * drawing ("before") turning into the photograph ("after") behind a bleeding,
 * noise-displaced front that travels from the upper right to the lower left. A
 * narrow band of warm morning light rides the front wherever the picture changes.
 *
 * Drawn only on demand (progress or size change); never runs a loop of its own.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/** The front's travel in sweep units; the textures change between g ≈ 0 and 1. */
const FRONT_FROM = -0.15;
const FRONT_TO = 1.1;

const FRAGMENT = `
#define FRONT_FROM ${FRONT_FROM.toFixed(3)}
#define FRONT_TO ${FRONT_TO.toFixed(3)}
precision mediump float;
uniform sampler2D uBefore;
uniform sampler2D uAfter;
uniform float uFront;
uniform vec2 uWindow;   // variant rows inside the texture (uv y0, y1)
uniform vec2 uDir;      // weights of (from-right, from-top) in the sweep
uniform vec2 uTexel;    // texture size in px
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}

void main() {
  vec3 before = texture2D(uBefore, vUv).rgb;
  vec3 after = texture2D(uAfter, vUv).rgb;
  vec2 px = vUv * uTexel;
  float wy = (vUv.y - uWindow.x) / (uWindow.y - uWindow.x);
  // 0 at the upper right of the variant window, 1 at its lower left.
  float g = ((1.0 - vUv.x) * uDir.x + wy * uDir.y) / (uDir.x + uDir.y);
  float coarse = fbm(px / 230.0) - 0.5;
  float fibre = fbm(px / 26.0) - 0.5;
  float e = g + coarse * 0.34 + fibre * 0.045;
  float f = mix(FRONT_FROM, FRONT_TO, uFront);
  // Passed where the displaced coordinate is behind the front; the ends of the
  // hold are exact (nothing passed at 0, everything at 1).
  float m = 1.0 - smoothstep(f - 0.03, f + 0.03, e);
  m = min(max(m, smoothstep(0.93, 1.0, uFront)), smoothstep(0.0, 0.05, uFront));
  vec3 col = mix(before, after, m);
  float change = clamp(length(after - before) * 2.2, 0.0, 1.0);
  // A wet edge: the paper darkens a touch where the pigment is still arriving.
  float rim = exp(-pow((e - f - 0.018) / 0.012, 2.0)) * change;
  col *= 1.0 - 0.07 * rim;
  // Morning light carried by the front (screen blend).
  float band = exp(-pow((e - f) / 0.075, 2.0)) * change;
  vec3 warm = vec3(1.0, 0.76, 0.5) * band * 0.42;
  col = 1.0 - (1.0 - col) * (1.0 - warm);
  gl_FragColor = vec4(col, 1.0);
}`;

export interface FrontOptions {
  readonly before: string;
  readonly after: string;
  readonly window: readonly [number, number];
  readonly dir: readonly [number, number];
}

export class FrontRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private textures: WebGLTexture[] = [];
  private size: [number, number] = [1, 1];
  private progress = 0;
  private frame = 0;
  private lost = false;
  ready = false;

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private options: FrontOptions,
  ) {
    this.gl = gl;
    this.program = this.link();
    canvas.addEventListener("webglcontextlost", this.onLost, false);
  }

  /** Returns null when WebGL is unavailable; the static plate then stays. */
  static create(
    canvas: HTMLCanvasElement,
    options: FrontOptions,
  ): FrontRenderer | null {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl) return null;
    try {
      return new FrontRenderer(canvas, gl, options);
    } catch {
      return null;
    }
  }

  private onLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    this.ready = false;
  };

  private compile(type: number, source: string) {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    return shader;
  }

  private link() {
    const gl = this.gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? "program");
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of ["uBefore", "uAfter", "uFront", "uWindow", "uDir", "uTexel"])
      this.uniforms[name] = gl.getUniformLocation(program, name);
    return program;
  }

  private static async decode(src: string) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`front texture ${response.status}`);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  /** Fetches and uploads both textures; resolves once the first frame can draw. */
  async load() {
    const [before, after] = await Promise.all([
      FrontRenderer.decode(this.options.before),
      FrontRenderer.decode(this.options.after),
    ]);
    if (this.lost) return false;
    const gl = this.gl;
    [before, after].forEach((bitmap, unit) => {
      const texture = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bitmap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.textures.push(texture);
    });
    gl.uniform1i(this.uniforms.uBefore, 0);
    gl.uniform1i(this.uniforms.uAfter, 1);
    gl.uniform2f(this.uniforms.uWindow, this.options.window[0], this.options.window[1]);
    gl.uniform2f(this.uniforms.uDir, this.options.dir[0], this.options.dir[1]);
    gl.uniform2f(this.uniforms.uTexel, before.width, before.height);
    before.close();
    after.close();
    this.ready = true;
    this.draw();
    return true;
  }

  /** Match the drawing buffer to the canvas's CSS box (device pixels, capped). */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(1, Math.round(rect.width * dpr)),
      h = Math.max(1, Math.round(rect.height * dpr));
    if (w === this.size[0] && h === this.size[1]) return;
    this.size = [w, h];
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.request();
  }

  set front(value: number) {
    if (Math.abs(value - this.progress) < 0.0005) return;
    this.progress = value;
    this.request();
  }

  private request() {
    if (!this.ready || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }

  private draw() {
    if (!this.ready || this.lost) return;
    const gl = this.gl;
    gl.uniform1f(this.uniforms.uFront, this.progress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.canvas.removeEventListener("webglcontextlost", this.onLost, false);
    const gl = this.gl;
    for (const t of this.textures) gl.deleteTexture(t);
    gl.deleteProgram(this.program);
    this.ready = false;
  }
}

/** Front position (0–1) at which the sweep passes a point, ignoring the noise. */
export function frontAt(
  x: number,
  y: number,
  box: { left: number; width: number; top: number; height: number },
  window: readonly [number, number],
  dir: readonly [number, number],
) {
  const u = (x - box.left) / box.width;
  const v = (y - box.top) / box.height;
  const wy = (v - window[0]) / (window[1] - window[0]);
  const g = ((1 - u) * dir[0] + wy * dir[1]) / (dir[0] + dir[1]);
  return (g - FRONT_FROM) / (FRONT_TO - FRONT_FROM);
}
