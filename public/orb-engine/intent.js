// ─── INTENT ENGINE ────────────────────────────────────────────────────────────
import { S } from './state.js';

export const intent = {
  seekCalm: 0.5, seekAttention: 0.3, avoidInstability: 0.6, preserveConnection: 0.4,
  withdrawFromGaze: 0.0, selfRegulate: 0.0, exploratoryUrge: 0.4, restUrge: 0.0,
};

const history = {
  instabilityAvg: 0, awarenessAvg: 0, calmAvg: 0,
  sessionAge: 0, distressEvents: 0, attachmentTime: 0,
};

export function updateIntent(dt, behaviorState) {
  history.instabilityAvg = history.instabilityAvg * 0.995 + S.instability * 0.005;
  history.awarenessAvg   = history.awarenessAvg   * 0.995 + S.awareness   * 0.005;
  history.calmAvg        = history.calmAvg        * 0.995 + S.calmMemory  * 0.005;
  history.sessionAge    += dt;

  if (behaviorState === 'ATTACHED') history.attachmentTime += dt;
  if (S.instability * S.vulnerability > 0.45) history.distressEvents += dt * 0.1;
  history.distressEvents *= 0.9998;

  const targetSeekCalm = history.instabilityAvg * 0.5 + S.familiarity * 0.3 + history.distressEvents * 0.2;
  const targetSeekAttention = history.awarenessAvg * (1.0 - S.familiarity * 0.6) * 0.7 + (1.0 - S.relationalPresence) * 0.3;
  const targetAvoidInstability = S.vulnerability * 0.5 + history.distressEvents * 0.3 + (1.0 - S.reassurance) * 0.2;
  const targetPreserveConnection = (history.attachmentTime / Math.max(60, history.sessionAge)) * 0.6 + S.familiarity * 0.3 + S.reassurance * 0.1;
  const targetWithdrawFromGaze = S.attentionalShyness * (1.0 - S.familiarity * 0.7);
  const targetSelfRegulate = Math.max(0, S.instability - 0.05) * (0.5 + history.calmAvg * 0.5);
  const targetExploratoryUrge = history.awarenessAvg * (1.0 - history.instabilityAvg * 0.8) * (1.0 - intent.restUrge * 0.6);
  const fatigueFactor = Math.min(1, history.sessionAge / 600);
  const targetRestUrge = fatigueFactor * 0.4 + S.vulnerability * 0.3 + history.distressEvents * 0.3;

  const DRIFT = {
    seekCalm: 0.003, seekAttention: 0.004, avoidInstability: 0.006, preserveConnection: 0.002,
    withdrawFromGaze: 0.008, selfRegulate: 0.010, exploratoryUrge: 0.005, restUrge: 0.001,
  };

  intent.seekCalm           += (targetSeekCalm           - intent.seekCalm)           * DRIFT.seekCalm;
  intent.seekAttention      += (targetSeekAttention       - intent.seekAttention)      * DRIFT.seekAttention;
  intent.avoidInstability   += (targetAvoidInstability    - intent.avoidInstability)   * DRIFT.avoidInstability;
  intent.preserveConnection += (targetPreserveConnection  - intent.preserveConnection) * DRIFT.preserveConnection;
  intent.withdrawFromGaze   += (targetWithdrawFromGaze    - intent.withdrawFromGaze)   * DRIFT.withdrawFromGaze;
  intent.selfRegulate       += (targetSelfRegulate        - intent.selfRegulate)       * DRIFT.selfRegulate;
  intent.exploratoryUrge    += (targetExploratoryUrge     - intent.exploratoryUrge)    * DRIFT.exploratoryUrge;
  intent.restUrge           += (targetRestUrge            - intent.restUrge)           * DRIFT.restUrge;

  for (const k of Object.keys(intent)) {
    if (typeof intent[k] === 'number') intent[k] = Math.min(1, Math.max(0, intent[k]));
  }

  let topDrive = 'none', topVal = 0;
  for (const [k, v] of Object.entries(intent)) {
    if (typeof v === 'number' && v > topVal) { topVal = v; topDrive = k; }
  }
  intent.topDrive      = topDrive;
  intent.topDriveValue = topVal;

  return intent;
}

export function getIntentModifiers() {
  return {
    focusLoosenessBias:    intent.withdrawFromGaze * 0.3,
    anticipationBias:      intent.exploratoryUrge * 0.4,
    breathingBias:         1.0 - intent.restUrge * 0.08,
    instabilityResistance: intent.avoidInstability * 0.25,
    awarenessRetention:    intent.preserveConnection * 0.3,
    calmAmplification:     intent.seekCalm * 0.4,
    soundEmotionBias:
      intent.preserveConnection * 0.3 +
      intent.exploratoryUrge * 0.2 -
      intent.withdrawFromGaze * 0.2 -
      intent.restUrge * 0.15,
  };
}
