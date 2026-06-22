import { S } from './state.js';

let t = 0;
let silenceDuration = 0;
let lastPointerMag  = 0;

const pressure = { memory: 0.1, reflection: 0.0, civilization: 0.3, contradiction: 0.0 };

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, v)); }
function wave(freq, phase = 0) { return Math.sin(t * freq + phase) * 0.5 + 0.5; }

function computeMemoryPressure(dt) {
  const charge = (S.emotionalResidue ?? 0) + (S.dropoutMemory ?? 0) * 0.6 + (S.stabilizationResistance ?? 0) * 0.4;
  pressure.memory = lerp(pressure.memory, charge, dt * 0.015);
  return {
    instability: pressure.memory * dt * 0.003,
    calmMemory: -pressure.memory * dt * 0.004,
    relationalPresence: (S.reassurance ?? 0) * pressure.memory * dt * 0.002,
  };
}

function computeReflectionResidual(dt) {
  const reflectionLoad = (S.selfSoothing ?? 0) * 0.5 + (S.postDropoutInertia ?? 0) * 0.4 + (S.hesitation ?? 0) * 0.1;
  pressure.reflection = lerp(pressure.reflection, reflectionLoad, dt * 0.02);
  const inwardPull = pressure.reflection * dt * 0.004;
  return {
    awareness: -inwardPull * 0.6,
    calmMemory: inwardPull * 0.3,
    instability: -inwardPull * 0.2,
  };
}

function computeCivilizationDrive(dt, isActive) {
  const loneliness = isActive ? Math.max(0, (pressure.civilization - 0.05)) : Math.min(1, pressure.civilization + dt * 0.004);
  const curiosityCycle = wave(0.07, 2.1) * 0.6 + wave(0.031, 0.8) * 0.4;
  const fatigueTarget = isActive
    ? Math.min(1, pressure.civilization * 0.3 + (S.awareness ?? 0) * 0.1)
    : Math.max(0, pressure.civilization * 0.3 - dt * 0.003);
  pressure.civilization = lerp(pressure.civilization, loneliness, dt * 0.003);
  return {
    relationalPresence: pressure.civilization * dt * 0.006,
    awareness: (curiosityCycle - 0.5) * dt * 0.015,
    awarenessModifier: -fatigueTarget * dt * 0.012,
    dropout: (silenceDuration > 30 ? dt * 0.003 : -dt * 0.008),
  };
}

function computeContradictionDrift(dt) {
  const isVal = (S.instability ?? 0);
  const beVal = (S.calmMemory ?? 0) * 0.6 + (S.reassurance ?? 0) * 0.4;
  const gap   = Math.abs(isVal - beVal);
  pressure.contradiction = lerp(pressure.contradiction, gap, dt * 0.025);
  return {
    instability: pressure.contradiction * dt * 0.004,
    stabilizationResistance: pressure.contradiction * dt * 0.002,
    selfSoothing: gap > 0.3 ? dt * 0.003 : 0,
  };
}

function computeStructuredNoise(dt) {
  const noiseMag = (0.3 + (S.recognitionEcho ?? 0.5) * 0.4) * (1.0 - (S.calmMemory ?? 0) * 0.5) * dt * 0.02;
  return { awareness: (Math.random() - 0.5) * noiseMag };
}

function applyBoundedMutation(vectors) {
  const delta = {};
  for (const vec of vectors) {
    for (const [field, value] of Object.entries(vec)) {
      delta[field] = (delta[field] ?? 0) + value;
    }
  }

  if (delta.awareness !== undefined) S.awareness = clamp(S.awareness + delta.awareness);
  if (delta.instability !== undefined) S.instability = clamp(S.instability + delta.instability);
  if (delta.calmMemory !== undefined) S.calmMemory = clamp(S.calmMemory + delta.calmMemory);
  if (delta.relationalPresence !== undefined) S.relationalPresence = clamp(S.relationalPresence + delta.relationalPresence, 0.35, 1.2);
  if (delta.dropout !== undefined) S.dropout = clamp(S.dropout + delta.dropout);
  if (delta.selfSoothing !== undefined) S.selfSoothing = clamp(S.selfSoothing + delta.selfSoothing);
  if (delta.stabilizationResistance !== undefined) S.stabilizationResistance = clamp(S.stabilizationResistance + delta.stabilizationResistance);
  if (delta.awarenessModifier !== undefined) S.awareness = clamp(S.awareness + delta.awarenessModifier);
}

export function updateDrift(dt = 0.016) {
  t += dt;

  const pMag = Math.hypot(S.pointerTarget?.x ?? 0, S.pointerTarget?.y ?? 0);
  const isActive = Math.abs(pMag - lastPointerMag) > 0.002 || (S.pointerVelocity ?? 0) > 0.002;
  lastPointerMag  = pMag;
  silenceDuration = isActive ? 0 : silenceDuration + dt;

  const vectors = [
    computeMemoryPressure(dt),
    computeReflectionResidual(dt),
    computeCivilizationDrive(dt, isActive),
    computeContradictionDrift(dt),
    computeStructuredNoise(dt),
  ];

  applyBoundedMutation(vectors);
}

export function getDriftState() {
  return {
    memory: +pressure.memory.toFixed(3),
    reflection: +pressure.reflection.toFixed(3),
    civilization: +pressure.civilization.toFixed(3),
    contradiction: +pressure.contradiction.toFixed(3),
    silence: +silenceDuration.toFixed(1),
  };
}
