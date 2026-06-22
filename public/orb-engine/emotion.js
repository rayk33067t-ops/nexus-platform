// ─── EMOTIONAL INERTIA ────────────────────────────────────────────────────────
import { S } from './state.js';

export const emotion = {
  valence: 0.0, arousal: 0.0, tension: 0.0, openness: 0.5, longing: 0.0,
  _targetValence: 0.0, _targetArousal: 0.0, _targetTension: 0.0,
  _targetOpenness: 0.5, _targetLonging: 0.0,
  valenceResidue: 0.0, arousalResidue: 0.0, tensionResidue: 0.0,
};

const RISE_RATES  = { valence: 0.008, arousal: 0.045, tension: 0.035, openness: 0.012, longing: 0.004 };
const FALL_RATES  = { valence: 0.004, arousal: 0.025, tension: 0.008, openness: 0.015, longing: 0.003 };
const RESIDUE_DECAY = { valence: 0.0008, arousal: 0.003, tension: 0.001 };

export function updateEmotion(dt, behaviorState, personality) {
  const p = personality ?? {};

  emotion._targetValence = Math.min(1, Math.max(-1,
    S.calmMemory * 0.5 + S.familiarity * 0.4 + S.reassurance * 0.3 -
    S.vulnerability * 0.6 - S.instability * 0.4 + (p.warmth ?? 0.5) * 0.2
  ));

  emotion._targetArousal = Math.min(1,
    S.awareness * 0.5 + S.pointerVelocity * 4.0 + S.instability * 0.3 + (p.curiosity ?? 0.5) * 0.15
  );

  emotion._targetTension = Math.min(1,
    S.instability * 0.5 + S.vulnerability * 0.3 + S.attentionalShyness * 0.2 + (p.volatility ?? 0.3) * 0.15
  );

  emotion._targetOpenness = Math.min(1,
    S.calmMemory * 0.4 + S.familiarity * 0.3 + S.relationalPresence * 0.2 +
    (p.empathy ?? 0.5) * 0.1 - S.attentionalShyness * 0.3 - S.vulnerability * 0.2
  );

  const halfPresent = S.awareness * (1.0 - S.familiarity);
  emotion._targetLonging = Math.min(1,
    halfPresent * 0.6 + S.dropout * 0.3 + (p.empathy ?? 0.5) * 0.1
  );

  const frame = dt * 60;

  function lerp1(current, target, dim) {
    const r = target > current ? RISE_RATES[dim] : FALL_RATES[dim];
    const recoveryBoost = dim === 'tension' ? (p.resilience ?? 0.5) * 0.5 : 1.0;
    const rate = target > current ? r : r * recoveryBoost;
    return current + (target - current) * rate * frame;
  }

  emotion.valence  = lerp1(emotion.valence,  emotion._targetValence,  'valence');
  emotion.arousal  = lerp1(emotion.arousal,  emotion._targetArousal,  'arousal');
  emotion.tension  = lerp1(emotion.tension,  emotion._targetTension,  'tension');
  emotion.openness = lerp1(emotion.openness, emotion._targetOpenness, 'openness');
  emotion.longing  = lerp1(emotion.longing,  emotion._targetLonging,  'longing');

  const negValence = Math.max(0, -emotion.valence);
  emotion.valenceResidue += negValence * 0.005 * frame;
  emotion.valenceResidue -= RESIDUE_DECAY.valence * frame;
  emotion.valenceResidue  = Math.max(0, Math.min(0.5, emotion.valenceResidue));

  emotion.arousalResidue += emotion.arousal * 0.002 * frame;
  emotion.arousalResidue -= RESIDUE_DECAY.arousal * frame;
  emotion.arousalResidue  = Math.max(0, Math.min(0.4, emotion.arousalResidue));

  emotion.tensionResidue += emotion.tension * 0.003 * frame;
  emotion.tensionResidue -= RESIDUE_DECAY.tension * frame;
  emotion.tensionResidue  = Math.max(0, Math.min(0.6, emotion.tensionResidue));

  S.emotion.valence  = emotion.valence;
  S.emotion.arousal  = emotion.arousal;
  S.emotion.tension  = emotion.tension;
  S.emotion.openness = emotion.openness;
  S.emotion.longing  = emotion.longing;
  S.emotion.residue  = emotion.tensionResidue;

  return emotion;
}

export function getEmotionModifiers(em) {
  return {
    brightnessBoost:  em.arousal * 0.12,
    fragmentationBoost: (em.tension + em.tensionResidue) * 0.4,
    rimWidening:      em.openness * 0.3,
    longingBleed:     em.longing * 0.15,
    breathValenceBias: em.valence * 0.04,
    soundValence:     em.valence,
    soundArousal:     em.arousal + em.arousalResidue,
  };
}
