import { S, historyPush, historySample, INHALE, HOLD, EXHALE, CYCLE } from './state.js';
import { deriveColorState, lerpColor, COLORS, updateEvolution, EVOLUTION } from './colors.js';
import { updateIntent, getIntentModifiers } from './intent.js';
import { updatePersonality, getPersonalityModifiers } from './personality.js';
import { updateEmotion, getEmotionModifiers } from './emotion.js';
import { updateBeliefs, COGNITION, BELIEFS } from './beliefs.js';
import { updateCognition, generateNarrative, META_BELIEFS, UNCERTAINTY } from './cognition.js';

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, v)); }

const STATE_DIRECTIVES = {
  CALM: { colorState: 'stable', breathingScale: 1.00, focusLooseness: 0.30, anticipationScale: 0.60, turbulenceScale: 0.20, soundEmotion: 0.20, transitionSpeed: 0.04 },
  CURIOUS: { colorState: 'aware', breathingScale: 1.05, focusLooseness: 0.60, anticipationScale: 1.20, turbulenceScale: 0.50, soundEmotion: 0.40, transitionSpeed: 0.10 },
  SHY: { colorState: 'dormant', breathingScale: 0.94, focusLooseness: 0.80, anticipationScale: 0.30, turbulenceScale: 0.60, soundEmotion: 0.00, transitionSpeed: 0.06 },
  DISTRESSED: { colorState: 'corrupted', breathingScale: 0.88, focusLooseness: 0.90, anticipationScale: 0.40, turbulenceScale: 1.00, soundEmotion: -0.60, transitionSpeed: 0.18 },
  ATTACHED: { colorState: 'evolving', breathingScale: 1.08, focusLooseness: 0.15, anticipationScale: 1.40, turbulenceScale: 0.10, soundEmotion: 0.70, transitionSpeed: 0.025 },
  DISSOCIATING: { colorState: 'dormant', breathingScale: 0.92, focusLooseness: 1.00, anticipationScale: 0.10, turbulenceScale: 0.30, soundEmotion: -0.30, transitionSpeed: 0.03 },
  SELF_SOOTHING: { colorState: 'focused', breathingScale: 0.97, focusLooseness: 0.40, anticipationScale: 0.50, turbulenceScale: 0.20, soundEmotion: 0.10, transitionSpeed: 0.05 },
  HYPER_AWARE: { colorState: 'focused', breathingScale: 0.95, focusLooseness: 0.05, anticipationScale: 1.60, turbulenceScale: 0.70, soundEmotion: 0.50, transitionSpeed: 0.14 },
};

let currentStateColor   = [...COLORS.dormant];
let currentEmotionColor = [...COLORS.aware];
let currentEmotionWeight = 0;
let currentFragmentation = 0;
let emotionalResidue     = 0;
let lastColorName        = 'dormant';
let evolutionStage = 1;

const STATE_TRANSITION_SPEEDS = { dormant: 0.04, aware: 0.12, focused: 0.10, creative: 0.14, emotional: 0.22, stable: 0.03, evolving: 0.025, corrupted: 0.20, ascended: 0.008 };
const RECOVERY_SPEEDS = { dormant: 0.08, aware: 0.10, focused: 0.10, creative: 0.08, emotional: 0.03, stable: 0.12, evolving: 0.06, corrupted: 0.015, ascended: 0.04 };

const mem = { vel: new Float32Array(60), emot: new Float32Array(120), velH: 0, emotH: 0, smoothVel: 0, smoothEmot: 0 };

function memPush(arr, head, val, size) { arr[head % size] = val; return (head + 1) % size; }
function memAvg(arr, size) { let s = 0; for (let i = 0; i < size; i++) s += arr[i]; return s / size; }

export const driver = {
  awareness: 0, instability: 0, emotion: 0, fragmentation: 0,
  velocity: 0, breath: 0, breathRadius: 1.0, time: 0,
  pointer: { x: 0, y: 0 },
  stateR: 0, stateG: 0, stateB: 0,
  emotionR: 0, emotionG: 0, emotionB: 0,
  evolutionStage: 1,
};

function deriveBehaviorState() {
  const calm           = S.calmMemory * S.reassurance * S.familiarity;
  const distress       = S.instability * S.vulnerability;
  const socialPressure = S.awareness * (1.0 - S.familiarity);

  if (distress > 0.45)         return 'DISTRESSED';
  if (S.selfSoothing > 0.25)   return 'SELF_SOOTHING';
  if (socialPressure > 0.5)    return 'SHY';
  if (calm > 0.4)              return 'ATTACHED';
  if (S.awareness > 0.75)      return 'HYPER_AWARE';
  return 'CURIOUS';
}

function updatePointerSmoothing(dt) {
  S.pointer.lerp(S.pointerTarget, dt * 3.0);
  S.pointerVelocity = lerp(S.pointerVelocity, S.pointer.distanceTo(S.pointerTarget), dt * 8.0);
}

function updateBreathing(elapsed, dt, behavior) {
  const ms = elapsed * 1000;
  const slowWaveA = Math.sin(ms * 0.00008);
  const slowWaveB = Math.sin(ms * 0.00013 + 1.7);
  const biologicalDrift = (slowWaveA + slowWaveB) * 0.5;

  const tension = S.instability * 0.12 + S.attentionDropout * 0.18 + S.stabilizationResistance * 0.08 + S.vulnerability * 0.06 - S.selfSoothing * 0.05;
  const calmExpansion = S.calmMemory * 0.04 + S.familiarity * 0.025 + S.reassurance * 0.03;
  const awarenessCompression = S.awareness * S.relationalPresence * 0.03;

  const targetRadius = (1.0 + biologicalDrift * 0.015 + calmExpansion - tension - awarenessCompression) * behavior.breathingScale;

  const spring = (targetRadius - S.breathingRadius) * 0.015;
  S.breathingVelocity += spring;
  S.breathingVelocity *= 0.92;
  S.breathingRadius   += S.breathingVelocity;

  S.breathPhase = (S.breathPhase + dt) % CYCLE;
  const t = S.breathPhase;
  let breathValue;
  if (t < INHALE) {
    breathValue = 0.5 - 0.5 * Math.cos((t / INHALE) * Math.PI);
  } else if (t < INHALE + HOLD) {
    breathValue = 1.0 - ((t - INHALE) / HOLD) * 0.015;
  } else {
    breathValue = 0.5 + 0.5 * Math.cos(((t - INHALE - HOLD) / EXHALE) * Math.PI);
  }
  S.breath = breathValue * 2.0 - 1.0;
}

function updateFocusSystem(elapsed, behavior) {
  const ms = elapsed * 1000;
  const v  = S.pointerVelocity;

  historyPush(S.pointerTarget.x, S.pointerTarget.y);

  const cycle   = (Math.sin(ms * 0.00025) + 1) * 0.5;
  const delayMs = 150 + cycle * 250;
  const past    = historySample(delayMs);
  S.delayedPointer.x = lerp(S.delayedPointer.x, past.x, 0.035);
  S.delayedPointer.y = lerp(S.delayedPointer.y, past.y, 0.035);

  const driftX = Math.sin(ms * 0.00011) * 0.015;
  const driftY = Math.cos(ms * 0.00008) * 0.015;

  const instabInfluence = Math.abs(S.instability) * 0.003;
  const calmSup         = 1.0 - S.calmMemory * 0.7;
  const awareTight      = 1.0 - S.awareness * 0.5;
  const activity = instabInfluence * calmSup * awareTight + S.attentionalShyness * 0.002 - S.reassurance * 0.0015;

  if (Math.random() < 0.008 + activity) {
    S.microsaccadeTarget.x = (Math.random() - 0.5) * activity;
    S.microsaccadeTarget.y = (Math.random() - 0.5) * activity;
  }
  S.microsaccadeVelocity.x += (S.microsaccadeTarget.x - S.microsaccadeOffset.x) * 0.08;
  S.microsaccadeVelocity.y += (S.microsaccadeTarget.y - S.microsaccadeOffset.y) * 0.08;
  S.microsaccadeVelocity.multiplyScalar(0.82);
  S.microsaccadeOffset.add(S.microsaccadeVelocity);
  S.microsaccadeTarget.multiplyScalar(0.96);

  const curiosityZone = 1.0 - Math.abs(S.awareness - 0.5) * 2.0;
  const calmRed = 1.0 - S.calmMemory * 0.6;
  const cs = v * curiosityZone * calmRed * (0.12 + S.attentionalShyness * 0.08);
  const vel2d = S.pointerTarget.clone().sub(S.pointer);
  S.curiosityDrift.addScaledVector(vel2d, cs);
  S.curiosityDrift.multiplyScalar(0.94);

  const awarenessFactor = S.awareness * 0.6;
  const instabRed = 1.0 - Math.abs(S.instability) * 0.5;
  const predStrength = v * awarenessFactor * instabRed * S.relationalPresence * behavior.anticipationScale * 0.9;
  S.anticipation.lerp(vel2d.multiplyScalar(predStrength), 0.04);
  S.anticipation.multiplyScalar(0.96);

  const angle = Math.atan2(vel2d.y, vel2d.x);
  let angDelta = Math.abs(angle - S.lastFocusAngle);
  if (angDelta > Math.PI) angDelta = Math.PI * 2 - angDelta;
  const targetHes = Math.min(1.0, angDelta * (0.6 + S.vulnerability * 0.4) * (1.0 - S.recognitionEcho * 0.18));
  S.hesitation += (targetHes - S.hesitation) * 0.04;
  S.hesitation *= (1.0 - S.calmMemory * 0.03) * (1.0 - S.familiarity * 0.08);
  S.lastFocusAngle = angle;

  const tx = S.delayedPointer.x + S.microsaccadeOffset.x + S.curiosityDrift.x + S.anticipation.x + driftX;
  const ty = S.delayedPointer.y + S.microsaccadeOffset.y + S.curiosityDrift.y + S.anticipation.y + driftY;

  const focusSpeed = 0.06 * S.relationalPresence * (1.0 - S.hesitation * 0.35 + S.reassurance * 0.08) * (1.0 - behavior.focusLooseness * 0.5);

  S.awarenessFocus.x = lerp(S.awarenessFocus.x, tx, focusSpeed);
  S.awarenessFocus.y = lerp(S.awarenessFocus.y, ty, focusSpeed);
}

function updateAwarenessChain(elapsed, dt, intentMod) {
  const ms = elapsed * 1000;

  S.phaseDrift += (S.dropoutMemory - S.phaseDrift) * 0.01;
  S.phaseDrift -= S.calmMemory * 0.002;

  const waveA = (Math.sin(ms * 0.000021) + 1.0) * 0.5;
  const stabPhase = S.phaseDrift * (1.0 - S.calmMemory * 0.15);
  const waveB = (Math.sin(ms * 0.000021 * 1.73 + 2.4 + stabPhase) + 1.0) * 0.5;
  const combined = waveA * waveB;

  S.awarenessBaseline += (0.5 - S.awarenessBaseline) * 0.0005;
  S.awarenessBaseline += (S.calmMemory - S.dropoutMemory) * 0.0008;

  const focusDist = S.awarenessFocus.length();
  const baseAwareness = Math.max(0, 1.0 - focusDist) * S.awarenessBaseline;

  const ENTER_ZONE = 0.58, EXIT_ZONE = 0.42;
  if (baseAwareness > ENTER_ZONE) {
    S.inAttentionZone = 1;
  } else if (baseAwareness < EXIT_ZONE) {
    if (baseAwareness < EXIT_ZONE - S.dropoutMemory * 0.15) S.inAttentionZone = 0;
  }

  const zonePeak = 1.0 - Math.abs(baseAwareness - 0.5) * 2.0;
  const attentionPressure = S.inAttentionZone * zonePeak;
  const targetDropout = Math.pow(combined, 10.0) * 0.12 * attentionPressure;

  S.dropout            += (targetDropout - S.dropout) * 0.008;
  S.dropoutMemory      += (S.dropout - S.dropoutMemory) * 0.02;
  S.postDropoutInertia += (S.dropoutMemory - S.postDropoutInertia) * 0.015;
  S.attentionDropout    = S.dropout + S.dropoutMemory * 0.15;

  const inertiaFactor = 1.0 - S.postDropoutInertia * 0.35 - S.attentionalShyness * 0.08;
  const rawAwareness  = baseAwareness * (1.0 - S.attentionDropout) * inertiaFactor;

  const RISE = 0.08, FALL = 0.02;
  const inertiaSlow = S.postDropoutInertia * 0.6;
  const riseRate = Math.max(FALL, RISE - inertiaSlow);
  const instFactor = 1.0 + S.stabilizationResistance * 1.5 - S.reassurance * 0.2;
  const retention  = intentMod?.awarenessRetention ?? 0;
  const fallRate   = FALL * (1.0 - retention * 0.5);
  const lsp        = rawAwareness > S.awareness ? riseRate / instFactor : fallRate / instFactor;

  S.awareness = lerp(S.awareness, rawAwareness, lsp);
  S.stabilizationResistance += (Math.abs(S.instability) - S.stabilizationResistance) * 0.03;
}

function updateRelationalChain() {
  const v = S.pointerVelocity;

  const smoothness   = 1.0 - Math.min(1.0, S.hesitation * 2.0);
  const currentSig   = v * 0.6 + smoothness * 0.4;
  S.motionSignature += (currentSig - S.motionSignature) * 0.002;
  const similarity   = 1.0 - Math.min(1.0, Math.abs(currentSig - S.motionSignature));
  S.recognitionEcho += (similarity - S.recognitionEcho) * 0.003;
  S.recognitionEcho *= (1.0 + S.calmMemory * 0.01);
  S.recognitionEcho  = clamp(S.recognitionEcho);

  const connection     = S.calmMemory * S.familiarity * S.reassurance * (1.0 + S.recognitionEcho * 0.2);
  const overload       = S.vulnerability + Math.abs(S.instability) * 0.8;
  const absence        = Math.max(0, 0.003 - v) * 120.0;
  const targetPresence = 1.0 + connection * 0.4 - overload * 0.5 - absence * 0.15;
  S.relationalPresence += (targetPresence - S.relationalPresence) * 0.003;
  S.relationalPresence  = clamp(S.relationalPresence, 0.35, 1.2);

  const targetReassurance = S.calmMemory * S.familiarity * (1.0 - S.vulnerability) * (1.0 + S.recognitionEcho * 0.25);
  S.reassurance += (targetReassurance - S.reassurance) * 0.006;
  S.reassurance *= (1.0 - Math.abs(S.instability) * 0.03);
  S.reassurance  = clamp(S.reassurance);

  const directAttn = Math.max(0, S.awareness - 0.82);
  S.attentionalShyness += (directAttn * (1.0 - S.familiarity * 0.6) - S.attentionalShyness) * 0.01;
  S.attentionalShyness *= (1.0 - S.calmMemory * 0.02);
  S.attentionalShyness  = clamp(S.attentionalShyness);

  const calmInteraction = S.calmMemory * (1.0 - v * 12.0);
  S.familiarity += (Math.max(0, calmInteraction) - S.familiarity) * 0.002;
  S.familiarity *= (1.0 - S.vulnerability * 0.01);
  S.familiarity  = clamp(S.familiarity);

  S.vulnerability += (Math.max(0, v - 0.01) - S.vulnerability) * 0.008;
  S.vulnerability *= (1.0 - S.calmMemory * 0.02) * 0.9992;

  S.selfSoothing += (Math.max(0, Math.abs(S.instability) - 0.02) - S.selfSoothing) * 0.01;
  S.selfSoothing *= (1.0 + S.calmMemory * 0.04);
}

function updateInstabilityAndCalm(elapsed, dt, intentMod) {
  const ms     = elapsed * 1000;
  const v      = S.pointerVelocity;
  const motionEcho = Math.tanh(v * 3.0) * (0.08 + S.vulnerability * 0.12);
  const driftVal   = Math.sin(ms * 0.07) * 0.5 + Math.sin(ms * 0.11 + 2.1) * 0.5 + motionEcho;
  const velInject  = v * (0.5 + driftVal * 0.5) * 0.4;
  const targetInst = S.awareness * (0.12 - S.familiarity * 0.01) * (1.0 - (intentMod?.instabilityResistance ?? 0) * 0.25) + velInject;
  const instFloor  = S.stabilizationResistance * 0.08;
  S.instability = lerp(S.instability, Math.max(targetInst, instFloor), 0.015 + S.selfSoothing * 0.03 * (1.0 + (intentMod?.calmAmplification ?? 0)));

  const noMotion = v < 0.002;
  S.calmMemory += ((noMotion ? Math.abs(S.instability) : 0.0) - S.calmMemory) * 0.01;
  S.instability *= (1.0 - S.calmMemory * 0.03);
}

function updateColors(elapsed, dt, behavior) {
  const colorState = deriveColorState({
    awareness: S.awareness, instability: S.instability, familiarity: S.familiarity,
    relationalPresence: S.relationalPresence, vulnerability: S.vulnerability,
    reassurance: S.reassurance, calmMemory: S.calmMemory,
  });

  const resolvedName = S.stateBlend > 0.4 ? behavior.colorState : (colorState.name ?? 'dormant');
  const enterSpeed   = STATE_TRANSITION_SPEEDS[resolvedName]  ?? 0.08;
  const recoverSpeed = RECOVERY_SPEEDS[lastColorName]         ?? 0.08;
  const stateSpeed   = resolvedName !== lastColorName ? enterSpeed : recoverSpeed;
  if (resolvedName !== lastColorName) lastColorName = resolvedName;

  const t60 = stateSpeed * dt * 60;
  currentStateColor    = lerpColor(currentStateColor,   colorState.primary,   t60);
  currentEmotionColor  = lerpColor(currentEmotionColor, colorState.secondary, t60 * 1.8);
  currentEmotionWeight += (colorState.weight - currentEmotionWeight) * t60 * 1.8;

  emotionalResidue += S.vulnerability * 0.015 * dt * 60;
  emotionalResidue += Math.max(0, S.instability - 0.05) * 0.01 * dt * 60;
  emotionalResidue -= 0.002 * dt * 60;
  emotionalResidue  = clamp(emotionalResidue, 0, 0.6);

  const fragTarget = Math.max(0, (S.instability - 0.08) * 6) * behavior.turbulenceScale;
  currentFragmentation += (fragTarget - currentFragmentation) * Math.min(1, 2.0 * dt);

  return Math.min(1, currentEmotionWeight + emotionalResidue);
}

function updateMemory() {
  const v = S.pointerVelocity;
  mem.velH  = memPush(mem.vel,  mem.velH,  v, 60);
  mem.emotH = memPush(mem.emot, mem.emotH, S.awareness * 0.6 + Math.abs(S.instability) * 0.4, 120);
  mem.smoothVel  = lerp(mem.smoothVel,  memAvg(mem.vel,  60),  0.05);
  mem.smoothEmot = lerp(mem.smoothEmot, memAvg(mem.emot, 120), 0.03);
}

function syncEmotionObject(behavior, dt) {
  S.emotion.current       = behavior.state;
  S.emotion.blend.calm    = behavior.state === 'ATTACHED' ? S.stateBlend : Math.max(0, S.emotion.blend.calm - dt * 0.3);
  S.emotion.blend.tense   = behavior.state === 'DISTRESSED' || behavior.state === 'SHY' ? S.stateBlend : Math.max(0, S.emotion.blend.tense - dt * 0.3);
  S.emotion.blend.excited = behavior.state === 'HYPER_AWARE' || behavior.state === 'CURIOUS' ? S.stateBlend : Math.max(0, S.emotion.blend.excited - dt * 0.3);
  S.emotion.residue = Math.max(0, S.emotion.residue * 0.97 + (S.vulnerability + Math.abs(S.instability)) * 0.01);
}

export function getStateDirectives(stateName) {
  return STATE_DIRECTIVES[stateName] ?? STATE_DIRECTIVES.CURIOUS;
}

export function updateBehavior(elapsed, dt) {
  updateBeliefs(dt);
  updateCognition(dt, elapsed);
  updatePointerSmoothing(dt);

  const intentState = updateIntent(dt, S.currentState);
  const intentMod   = getIntentModifiers();

  const pers    = updatePersonality(dt, S.currentState);
  S.personality = pers;
  const persMod = getPersonalityModifiers();

  const em    = updateEmotion(dt, S.currentState, pers);
  const emMod = getEmotionModifiers(em);

  const newState = deriveBehaviorState();
  if (newState !== S.currentState) {
    S.previousState = S.currentState;
    S.currentState  = newState;
  }
  const speed = STATE_DIRECTIVES[S.currentState]?.transitionSpeed ?? 0.08;
  S.stateBlend = S.stateBlend + (1.0 - S.stateBlend) * speed;

  const curr = STATE_DIRECTIVES[S.currentState];
  const prev = STATE_DIRECTIVES[S.previousState] ?? curr;
  const t    = S.stateBlend;
  const behavior = {
    colorState:        t > 0.5 ? curr.colorState : prev.colorState,
    breathingScale:    lerp(prev.breathingScale, curr.breathingScale, t) * (intentMod.breathingBias ?? 1.0) * (persMod.breathingBias ?? 1.0) + (emMod.breathValenceBias ?? 0),
    focusLooseness:    Math.min(1, lerp(prev.focusLooseness, curr.focusLooseness, t) + intentMod.focusLoosenessBias - persMod.focusBaseline),
    anticipationScale: lerp(prev.anticipationScale, curr.anticipationScale, t) * (1.0 + intentMod.anticipationBias + persMod.anticipationBaseline),
    turbulenceScale:   lerp(prev.turbulenceScale, curr.turbulenceScale, t),
    soundEmotion:      lerp(prev.soundEmotion, curr.soundEmotion, t) + intentMod.soundEmotionBias + persMod.soundPersonalityBias,
    fragmentationBoost: emMod.fragmentationBoost,
    brightnessBoost:    emMod.brightnessBoost,
    longingBleed:       emMod.longingBleed,
    state:             S.currentState,
    blend:             S.stateBlend,
    intent:            intentState,
    personality:       pers,
    emotion:           em,
    intentMod,
    persMod,
    emMod,
  };

  updateBreathing(elapsed, dt, behavior);
  updateFocusSystem(elapsed, behavior);
  updateAwarenessChain(elapsed, dt, intentMod);
  updateRelationalChain();
  updateInstabilityAndCalm(elapsed, dt, intentMod);
  updateMemory();
  syncEmotionObject(behavior, dt);

  const totalEmotionWeight = updateColors(elapsed, dt, behavior);

  driver.awareness    = S.awareness;
  driver.instability  = S.instability;
  driver.emotion      = totalEmotionWeight;
  driver.fragmentation = Math.min(1, currentFragmentation + (behavior.fragmentationBoost ?? 0));
  driver.velocity     = lerp(driver.velocity, mem.smoothVel * 6.0, 0.06);
  driver.breath       = S.breath;
  driver.breathRadius = S.breathingRadius;
  driver.time         = elapsed + S.phaseDrift;
  driver.pointer.x    = S.delayedPointer.x;
  driver.pointer.y    = S.delayedPointer.y;
  driver.stateR       = currentStateColor[0];
  driver.stateG       = currentStateColor[1];
  driver.stateB       = currentStateColor[2];
  driver.emotionR     = currentEmotionColor[0];
  driver.emotionG     = currentEmotionColor[1];
  driver.emotionB     = currentEmotionColor[2];
  driver.evolutionStage = evolutionStage;

  S.intent      = intentState;
  S.personality = pers;
  return behavior;
}
