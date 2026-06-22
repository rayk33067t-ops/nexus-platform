import * as THREE from 'three';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass }     from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/shaders/GammaCorrectionShader.js';
import { vertexShader, fragmentShader } from './colors.js';

export const renderer = new THREE.WebGLRenderer({
  antialias: true, alpha: false, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#020304');

export const camera = new THREE.PerspectiveCamera(
  42, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 4.8);

const ambient = new THREE.AmbientLight(0x5c677d, 0.08);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xdbe4ff, 1.15);
key.position.set(2, 3, 4);
scene.add(key);

export const voidMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshBasicMaterial({ color: 0x10131a, transparent: true, opacity: 0.18 })
);
voidMesh.position.z = -8;
scene.add(voidMesh);

export const uniforms = {
  uTime:           { value: 0 },
  uBreath:         { value: 0 },
  uPointer:        { value: new THREE.Vector2(0, 0) },
  uVelocity:       { value: 0 },
  uAwareness:      { value: 0 },
  uInstability:    { value: 0 },
  uBreathingRadius:{ value: 1.0 },
  uStateColor:     { value: new THREE.Color(0.020, 0.031, 0.086) },
  uEmotionColor:   { value: new THREE.Color(0.000, 0.733, 1.000) },
  uEmotionWeight:  { value: 0 },
  uFragmentation:  { value: 0 },
  uEmissiveBoost:  { value: 0 },
  uEvolutionStage: { value: 1.0 },
};

const orbMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
export const orb   = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 256), orbMaterial);
scene.add(orb);

export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, 0.4, 0.15
);

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);
composer.addPass(new ShaderPass(GammaCorrectionShader));

export function setBloom({ strength = 1.5, radius = 0.4, threshold = 0.15 } = {}) {
  if (!bloomPass) return;
  bloomPass.strength  = strength;
  bloomPass.radius    = radius;
  bloomPass.threshold = threshold;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

export function render() {
  composer.render();
}
