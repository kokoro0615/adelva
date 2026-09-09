/** Local procedural renderer. Measured field parameters: nosigner-home-spec.md. */
const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragment = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time, scroll, positionMix, surface, radius, blur, alpha, lightness, organicSpeed;
uniform vec3 color1, color2, color3, color4;
vec3 gradient(vec3 cell) {
  float value = 4096. * sin(dot(cell, vec3(17., 59.4, 15.)));
  float z = fract(512. * value);
  value *= .125;
  float x = fract(512. * value);
  value *= .125;
  return vec3(x, fract(512. * value), z) - .5;
}
float simplex(vec3 p) {
  vec3 cell = floor(p + dot(p, vec3(1./3.)));
  vec3 a = p - cell + dot(cell, vec3(1./6.));
  vec3 order = step(vec3(0.), a - a.yzx);
  vec3 first = order * (1. - order.zxy);
  vec3 second = 1. - order.zxy * (1. - order);
  vec3 b = a - first + 1./6.;
  vec3 c = a - second + 1./3.;
  vec3 d = a - .5;
  vec4 weights = max(.6 - vec4(dot(a,a),dot(b,b),dot(c,c),dot(d,d)), 0.);
  weights *= weights; weights *= weights;
  return 52. * dot(weights, vec4(dot(gradient(cell),a),
    dot(gradient(cell+first),b),dot(gradient(cell+second),c),dot(gradient(cell+1.),d)));
}
float grain(vec2 p) {
  return fract(cos(dot(p,vec2(23.14069263277926,2.665144142690225))) * 12345.6789);
}
void main() {
  vec2 p = (uv - .5) * resolution / min(resolution.x,resolution.y);
  p += .5 * vec2(sin(scroll*.0008),sin(scroll*.001)) * positionMix;
  float t = time * .09;
  float a = simplex(vec3(p,t)+.1+t*.05)*.5+.5;
  float b = simplex(vec3(p*5.,t)+.1+t*.05)*.5+.5;
  float c = simplex(vec3(p*2.,t)+.4+t*.02)*.5+.5;
  vec3 color = mix(mix(color4,color3,a),mix(color1,color2,b),c*c);
  color = mix(pow(color*1.4,vec3(1.3)),pow(color*1.2,vec3(1.5))*lightness,lightness);
  float edge = simplex(vec3(p*1.413,time*organicSpeed))*.5+.5;
  float r = radius * (1.+.75*(edge-.5));
  float spread = blur * (1.+1.5*edge);
  // Reversed smoothstep edges are undefined in GLSL; use equivalent ascending edges.
  float mask = (1.-smoothstep(r,r+spread,length(p))) *
               (1.-smoothstep(r-spread,r,length(p)));
  vec3 blended = color * mask * alpha + vec3(surface) * (1.-mask*alpha);
  // Preserve HDR values through grain; clipping earlier erases pale blue detail.
  vec2 n = uv; n.y *= grain(vec2(n.y,.4));
  gl_FragColor = vec4(blended + grain(n)*.1-.1,1.);
}
`;

export type Field = {
  surface: number;
  radius: number;
  blur: number;
  alpha: number;
  lightness: number;
  organicSpeed: number;
  color1: number[];
  color2: number[];
  color3: number[];
  color4: number[];
};
export const darkField: Field = {
  surface: 0,
  radius: 0.624,
  blur: 0.402,
  alpha: 0.053,
  lightness: 5,
  organicSpeed: 0.08,
  color1: [0.18, 0.58, 0.48],
  color2: [0.24, 0.43, 0.56],
  color3: [0.48, 0.59, 0.52],
  color4: [0.65, 0.47, 0.25],
};
export const lightField: Field = {
  surface: 1,
  radius: 2,
  blur: 2,
  alpha: 1,
  lightness: 0,
  organicSpeed: 0.051,
  color1: [1, 1, 1],
  color2: [1, 1, 1],
  color3: [0.85, 0.9, 0.87],
  color4: [0.91, 0.87, 0.78],
};

export function createAmbientRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
  });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const dispose = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  if (!program || !buffer) {
    dispose();
    return null;
  }
  for (const [kind, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(kind);
    if (!shader) {
      dispose();
      return null;
    }
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      dispose();
      return null;
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const names = [
    "resolution",
    "time",
    "scroll",
    "positionMix",
    ...Object.keys(darkField),
  ];
  const uniforms = Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  return {
    draw(field: Field, time: number, scroll: number, positionMix: number) {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(width * ratio),
        h = Math.round(height * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.scroll, scroll);
      gl.uniform1f(uniforms.positionMix, positionMix);
      for (const [key, value] of Object.entries(field)) {
        if (Array.isArray(value)) gl.uniform3fv(uniforms[key], value);
        else gl.uniform1f(uniforms[key], value);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose,
  };
}
