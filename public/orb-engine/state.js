import * as THREE from 'three';

export const S = {
  time: 0, delta: 0,
  pointer: new THREE.Vector2(), pointerTarget: new THREE.Vector2(), pointerVelocity: 0,
  pointerHistory: [], delayedPointer: new THREE.Vector2(), awarenessFocus: new THREE.Vector2(),
  awareness: 0, awarenessBaseline: 0.5, inAttentionZone: 0,
  dropout: 0, dropoutMemory: 0, postDropoutInertia: 0, attentionDropout: 0,
  phaseDrift: 0, stabilizationResistance: 0,
  instability: 0, calmMemory: 0, fragmentation: 0,
  microsaccadeOffset: new THREE.Vector2(), microsaccadeVelocity: new THREE.Vector2(),
  microsaccadeTarget: new THREE.Vector2(), curiosityDrift: new THREE.Vector2(),
  anticipation: new THREE.Vector2(), hesitation: 0, lastFocusAngle: 0,
  selfSoothing: 0, vulnerability: 0, familiarity: 0, attentionalShyness: 0,
  reassurance: 0, relationalPresence: 1.0, recognitionEcho: 0, motionSignature: 0,
  breath: 0, breathPhase: 0, breathingRadius: 1.0, breathingVelocity: 0,
  emotionalResidue: 0, velocityHistory: [], awarenessHistory: [],
  emotion: {
    current: 'CURIOUS', blend: { calm: 1, tense: 0, excited: 0 }, residue: 0,
    valence: 0.0, arousal: 0.0, tension: 0.0, openness: 0.5, longing: 0.0,
  },
  personality: null, intent: null,
  currentState: 'CURIOUS', previousState: 'CURIOUS', stateIntensity: 0, stateBlend: 0,
};

export function updatePointer(x, y) {
  S.pointerTarget.set(x, y);
}

const HISTORY_MAX = 120;

export function historyPush(x, y) {
  S.pointerHistory.push({ x, y, t: performance.now() });
  if (S.pointerHistory.length > HISTORY_MAX) S.pointerHistory.shift();
}

export function historySample(delayMs) {
  const target = performance.now() - delayMs;
  const hist   = S.pointerHistory;
  if (hist.length === 0) return S.pointer;
  for (let i = hist.length - 1; i > 0; i--) {
    const newer = hist[i];
    const older = hist[i - 1];
    if (older.t <= target && newer.t >= target) {
      const span  = newer.t - older.t || 1;
      const alpha = (target - older.t) / span;
      return new THREE.Vector2(
        THREE.MathUtils.lerp(older.x, newer.x, alpha),
        THREE.MathUtils.lerp(older.y, newer.y, alpha)
      );
    }
  }
  const oldest = hist[0];
  return new THREE.Vector2(oldest.x, oldest.y);
}

export const INHALE = 4.8;
export const HOLD   = 1.1;
export const EXHALE = 5.7;
export const CYCLE  = INHALE + HOLD + EXHALE;
