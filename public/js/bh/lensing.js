import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Falso lensing mejorado:
// 1. Sombra amplificada: la sombra real de un BH de Schwarzschild mide
//    ~2.6 veces el horizonte (b_crit = 3√3·rg). Remuestreamos el interior
//    para agrandar el disco negro central.
// 2. Bending ∝ 1/(t + c): los píxeles cercanos al anillo de Einstein se
//    desplazan más, estirando las estrellas en arcos tangenciales.
// 3. Bloom (UnrealBloomPass) antes del lensing: el glow también se curva.
// Pipeline: Render -> Bloom -> Lensing -> Output (ACES tone mapping).

const LensingShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uStrength: { value: 0 },
    uRadius: { value: 0.25 },
    uShadowUV: { value: 0.06 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uAspect;
    uniform float uStrength;
    uniform float uRadius;
    uniform float uShadowUV;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 delta = uv - uCenter;
      delta.x *= uAspect;
      float dist = length(delta);
      vec2 dir = dist > 1e-5 ? delta / dist : vec2(0.0);

      if (uStrength > 0.001) {
        // 1) Sombra amplificada: remapea el interior de la sombra
        //    La sombra real de Schwarzschild mide ~2.6 rs.
        //    Los píxeles dentro de uShadowUV samplean justo fuera,
        //    creando un borde nítido que "envuelve" el lensing.
        float shadowR = uShadowUV * (1.0 + 0.08 * uStrength);
        if (dist < shadowR) {
          float t = dist / shadowR;
          float newDist = shadowR + (1.0 - t) * shadowR * 0.35;
          vec2 off = dir * newDist;
          off.x /= uAspect;
          gl_FragColor = texture2D(tDiffuse, uCenter + off);
          return;
        }

        // 2) Bending radial tipo Einstein: máximo cerca de la sombra
        //    con caída lenta para estirar las estrellas en arcos tangenciales
        if (dist < uRadius) {
          float t = dist / uRadius;
          float bend = uStrength * 0.12 / (t + 0.08);
          bend = min(bend, 0.28);
          vec2 offset = dir * bend;
          offset.x /= uAspect;
          uv -= offset;
        }

        // 3) Arco tangencial: estiramiento perpendicular a la dirección radial
        //    para crear el efecto de "anillo de Einstein" con las estrellas
        if (dist < uRadius * 0.6 && dist > shadowR * 0.9) {
          float ringT = (dist - shadowR) / (uRadius * 0.6 - shadowR);
          float ringStr = uStrength * 0.06 * sin(ringT * 3.14159);
          vec2 tangent = vec2(-dir.y, dir.x);
          vec2 stretch = tangent * ringStr;
          stretch.x /= uAspect;
          uv += stretch;
        }
      }
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
};

export class Lensing {
  constructor(renderer, scene, camera) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // Bloom: sutil (referencia: strength 0.35, threshold 0.65)
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.30, 0.85, 0.65
    );
    this.composer.addPass(this.bloom);

    this.pass = new ShaderPass(LensingShader);
    this.composer.addPass(this.pass);

    this.composer.addPass(new OutputPass());
    this.tmp = new THREE.Vector3();
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
    this.pass.uniforms.uAspect.value = w / h;
  }

  // influenceRadius: radio del disco en el mundo (para el bending)
  // shadowRadius: radio del horizonte en el mundo (para la sombra amplificada ×2.6)
  update(camera, centerWorld, strength, influenceRadius = 8.5, shadowRadius = 1) {
    this.tmp.copy(centerWorld).project(camera);
    this.pass.uniforms.uCenter.value.set(this.tmp.x * 0.5 + 0.5, this.tmp.y * 0.5 + 0.5);
    this.pass.uniforms.uStrength.value = strength;
    const dist = camera.position.distanceTo(centerWorld);
    const fovRad = (camera.fov * Math.PI) / 180;
    const halfHeight = dist * Math.tan(fovRad / 2);
    this.pass.uniforms.uRadius.value = Math.min(0.6, (influenceRadius / (2 * halfHeight)) * 2.2);
    this.pass.uniforms.uShadowUV.value = Math.min(0.3, ((shadowRadius * 2.6) / (2 * halfHeight)) * 2.2);
  }

  render() {
    this.composer.render();
  }
}
