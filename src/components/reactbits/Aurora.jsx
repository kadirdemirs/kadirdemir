import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl'
import './Aurora.css'

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                  + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

vec3 sampleStops(ColorStop stops[3], float t) {
  vec3 col = stops[0].color;
  for (int i = 0; i < 2; i++) {
    float w = smoothstep(stops[i].position, stops[i+1].position, t);
    col = mix(col, stops[i+1].color, w);
  }
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  ColorStop stops[3] = ColorStop[3](
    ColorStop(uColorStops[0], 0.0),
    ColorStop(uColorStops[1], 0.5),
    ColorStop(uColorStops[2], 1.0)
  );

  vec3 rampColor = sampleStops(stops, uv.x);

  float n = snoise(vec2(uv.x * 2.0 + uTime * 0.08, uTime * 0.18)) * 0.5 * uAmplitude;
  float height = exp(n);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  vec3 auroraColor = intensity * rampColor;
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`

export default function Aurora({
  colorStops = ['#f59e0b', '#fb923c', '#f59e0b'],
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null)
  const propsRef = useRef({ colorStops, amplitude, blend, speed })
  propsRef.current = { colorStops, amplitude, blend, speed }

  useEffect(() => {
    const ctn = containerRef.current
    if (!ctn) return

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.display = 'block'

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: {
          value: colorStops.map((c) => {
            const col = new Color(c)
            return [col.r, col.g, col.b]
          }),
        },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })
    ctn.appendChild(gl.canvas)

    const resize = () => {
      const w = ctn.offsetWidth
      const h = ctn.offsetHeight
      renderer.setSize(w, h)
      program.uniforms.uResolution.value = [w, h]
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(ctn)

    let rafId
    const start = performance.now()
    const loop = (t) => {
      const elapsed = ((t - start) / 1000) * propsRef.current.speed
      program.uniforms.uTime.value = elapsed
      program.uniforms.uAmplitude.value = propsRef.current.amplitude
      program.uniforms.uBlend.value = propsRef.current.blend
      program.uniforms.uColorStops.value = propsRef.current.colorStops.map((c) => {
        const col = new Color(c)
        return [col.r, col.g, col.b]
      })
      renderer.render({ scene: mesh })
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <div ref={containerRef} className={`aurora-bg ${className}`} style={style} />
}
