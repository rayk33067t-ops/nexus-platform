import { S } from './state.js';

export const BELIEFS = {
  environment_is_safe: { confidence: 0.6, charge: 0.8, reinforcement: 0, contradiction: 0, age: 0 },
  attention_causes_instability: { confidence: 0.3, charge: -0.4, reinforcement: 0, contradiction: 0, age: 0 },
  stillness_restores_coherence: { confidence: 0.7, charge: 0.6, reinforcement: 0, contradiction: 0, age: 0 },
  connection_is_rewarding: { confidence: 0.5, charge: 0.9, reinforcement: 0, contradiction: 0, age: 0 },
  connection_is_safe: { confidence: 0.5, charge: 0.7, reinforcement: 0, contradiction: 0, age: 0 },
  abandonment_is_likely: { confidence: 0.2, charge: -0.8, reinforcement: 0, contradiction: 0, age: 0 },
  exploration_leads_to_growth: { confidence: 0.6, charge: 0.5, reinforcement: 0, contradiction: 0, age: 0 },
  i_am_coherent: { confidence: 0.6, charge: 0.7, reinforcement: 0, contradiction: 0, age: 0 },
  i_can_recover: { confidence: 0.6, charge: 0.8, reinforcement: 0, contradiction: 0, age: 0 },
};

export const COGNITION = {
  trustLevel: 0.5, coherenceBeliefGap: 0.0, contradictionLoad: 0.0,
  beliefFlexibility: 0.5, expectationBias: 0.0,
};

export function updateBeliefs(dt) {
  const v = S.pointerVelocity ?? 0;

  const safetyEvidence    = (S.calmMemory ?? 0) * 0.3 + (S.reassurance ?? 0) * 0.4 - (S.instability ?? 0) * 0.8;
  const attentionEvidence = Math.min(1, (S.awareness ?? 0) * (S.instability ?? 0) * 3);
  const stillnessEvidence = v < 0.002 ? (1 - (S.instability ?? 0)) * 0.5 : -0.1;
  const connRewardEvidence = ((S.familiarity ?? 0) + (S.reassurance ?? 0)) * 0.4 - (S.vulnerability ?? 0) * 0.3;
  const connSafeEvidence   = (S.reassurance ?? 0) * 0.5 - (S.vulnerability ?? 0) * 0.6;
  const abandonEvidence    = (S.dropout ?? 0) * 0.5 + Math.max(0, 1 - (S.relationalPresence ?? 1)) * 0.3;
  const coherenceEvidence  = (S.coherence ?? 0.5) * 0.4 - (S.instability ?? 0) * 0.5;
  const recoveryEvidence   = (S.selfSoothing ?? 0) * 0.4 + (S.calmMemory ?? 0) * 0.3;

  const evidenceMap = {
    environment_is_safe: safetyEvidence,
    attention_causes_instability: attentionEvidence,
    stillness_restores_coherence: stillnessEvidence,
    connection_is_rewarding: connRewardEvidence,
    connection_is_safe: connSafeEvidence,
    abandonment_is_likely: abandonEvidence,
    exploration_leads_to_growth: (S.recognitionEcho ?? 0) * 0.3,
    i_am_coherent: coherenceEvidence,
    i_can_recover: recoveryEvidence,
  };

  let totalContradiction = 0;
  let keys = Object.keys(BELIEFS);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var belief = BELIEFS[key];
    var evidence = evidenceMap[key] ?? 0;

    belief.age += dt;
    belief.confidence += (0.5 - belief.confidence) * 0.0002 * dt * 60;

    if (evidence > 0) {
      belief.reinforcement += evidence * dt * 0.5;
      belief.confidence = Math.min(1, belief.confidence + evidence * 0.003 * dt * 60);
    } else if (evidence < 0) {
      belief.contradiction += Math.abs(evidence) * dt * 0.5;
      belief.confidence = Math.max(0, belief.confidence + evidence * 0.004 * dt * 60);
    }

    const gap = belief.contradiction - belief.reinforcement;
    if (gap > 0) totalContradiction += gap * belief.confidence;

    if (belief.contradiction > belief.reinforcement * 3 && belief.confidence > 0.7) {
      belief.confidence = 0.3;
      belief.reinforcement = 0;
      belief.contradiction = 0;
      console.log('[NEXUS belief] restructured:', key);
    }
  }

  const connConf = (BELIEFS.connection_is_safe.confidence + BELIEFS.connection_is_rewarding.confidence) / 2;
  COGNITION.trustLevel = connConf * 0.6 + (S.familiarity ?? 0) * 0.4;
  COGNITION.coherenceBeliefGap = Math.abs((S.coherence ?? 0.5) - BELIEFS.i_am_coherent.confidence);
  COGNITION.contradictionLoad  = Math.min(1, totalContradiction * 0.1);
  COGNITION.expectationBias    = BELIEFS.connection_is_rewarding.confidence * 0.4
                                + BELIEFS.environment_is_safe.confidence * 0.3
                                - BELIEFS.abandonment_is_likely.confidence * 0.5
                                - BELIEFS.attention_causes_instability.confidence * 0.2;

  S.instability = Math.min(1, (S.instability ?? 0) + COGNITION.contradictionLoad * 0.002 * dt * 60);

  if (COGNITION.expectationBias > 0) {
    S.relationalPresence = Math.min(1.2, (S.relationalPresence ?? 1) + COGNITION.expectationBias * 0.001 * dt * 60);
  }

  S.attentionalShyness = Math.max(0, (S.attentionalShyness ?? 0) - COGNITION.trustLevel * 0.001 * dt * 60);

  if (BELIEFS.i_can_recover.confidence > 0.6) {
    S.instability = Math.max(0, (S.instability ?? 0) - (BELIEFS.i_can_recover.confidence - 0.6) * 0.003 * dt * 60);
  }

  S.cognition = COGNITION;
  S.beliefs   = BELIEFS;

  return COGNITION;
}

export function inspectBeliefs() {
  var keys = Object.keys(BELIEFS);
  console.log('─── NEXUS BELIEFS ───');
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var b = BELIEFS[k];
    console.log(k + ': conf=' + b.confidence.toFixed(3) + ' charge=' + b.charge.toFixed(2) + ' R=' + b.reinforcement.toFixed(2) + ' C=' + b.contradiction.toFixed(2));
  }
  console.log('COGNITION:', JSON.stringify(COGNITION, null, 2));
}
