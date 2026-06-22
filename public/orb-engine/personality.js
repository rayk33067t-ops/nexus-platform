import { S } from './state.js';

export const personality = {
  curiosity: 0.5, empathy: 0.5, resilience: 0.5,
  introversion: 0.5, volatility: 0.3, warmth: 0.5,
};

const traitHistory = {
  curiousTime: 0, attachedTime: 0, distressedTime: 0,
  calmTime: 0, volatileEvents: 0, sessionAge: 0,
};

export function updatePersonality(dt, behaviorState) {
  traitHistory.sessionAge += dt;

  if (behaviorState === 'CURIOUS' || behaviorState === 'HYPER_AWARE')
    traitHistory.curiousTime += dt;
  if (behaviorState === 'ATTACHED')
    traitHistory.attachedTime += dt;
  if (behaviorState === 'DISTRESSED')
    traitHistory.distressedTime += dt;
  if (S.calmMemory > 0.4)
    traitHistory.calmTime += dt;
  traitHistory.volatileEvents += S.instability * dt * 0.1;
  traitHistory.volatileEvents *= 0.9999;

  const age = Math.max(1, traitHistory.sessionAge);

  const targetCuriosity = Math.min(1,
    (traitHistory.curiousTime / age) * 2.0 + (1.0 - personality.introversion) * 0.2
  );
  const targetEmpathy = Math.min(1,
    (traitHistory.attachedTime / age) * 2.0 + S.familiarity * 0.3 + S.reassurance * 0.1
  );
  const targetResilience = Math.min(1,
    (traitHistory.calmTime / age) * 1.5 - (traitHistory.distressedTime / age) * 0.8
  );
  const targetIntroversion = Math.min(1,
    (traitHistory.calmTime - traitHistory.curiousTime) / Math.max(1, age) * 2.0 + 0.5
  );
  const targetVolatility = Math.min(1,
    traitHistory.volatileEvents * 0.3 + (1.0 - personality.resilience) * 0.2
  );
  const targetWarmth = Math.min(1,
    (traitHistory.attachedTime / age) * 1.5 + S.familiarity * 0.4
  );

  const RATE = 0.0001;
  personality.curiosity    += (targetCuriosity    - personality.curiosity)    * RATE;
  personality.empathy      += (targetEmpathy      - personality.empathy)      * RATE;
  personality.resilience   += Math.max(-0.5, Math.min(1, targetResilience) - personality.resilience) * RATE;
  personality.introversion += (targetIntroversion - personality.introversion) * RATE;
  personality.volatility   += (targetVolatility   - personality.volatility)   * RATE;
  personality.warmth       += (targetWarmth       - personality.warmth)       * RATE;

  for (const k of Object.keys(personality)) {
    personality[k] = Math.min(1, Math.max(0, personality[k]));
  }

  return personality;
}

export function getPersonalityModifiers() {
  return {
    anticipationBaseline: personality.curiosity * 0.3,
    focusBaseline: (1.0 - personality.introversion) * 0.1,
    awarenessAmplification: personality.empathy * 0.2,
    recoveryRate: personality.resilience * 0.4,
    instabilityAmplification: personality.volatility * 0.3,
    connectionRate: personality.warmth * 0.5,
    calmRetention: personality.introversion * 0.3,
    soundPersonalityBias: personality.warmth * 0.2 + personality.curiosity * 0.1 - personality.introversion * 0.15,
  };
}
