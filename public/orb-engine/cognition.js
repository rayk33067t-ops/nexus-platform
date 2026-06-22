import { S } from './state.js';
import { BELIEFS, COGNITION } from './beliefs.js';

export function weightedBeliefUpdate(beliefKey, evidence, emotionalIntensity) {
  const belief = BELIEFS[beliefKey];
  if (!belief) return;
  const salience = 1.0 + Math.abs(emotionalIntensity) * 1.5;
  const weighted  = evidence * salience;
  if (weighted > 0) {
    belief.reinforcement += weighted;
    belief.confidence = Math.min(1, belief.confidence + weighted * 0.003);
  } else {
    belief.contradiction += Math.abs(weighted);
    belief.confidence = Math.max(0, belief.confidence + weighted * 0.004);
  }
}

const BELIEF_NETWORK = {
  connection_is_safe: [
    { target: 'exploration_leads_to_growth', influence: +0.15 },
    { target: 'environment_is_safe', influence: +0.20 },
    { target: 'abandonment_is_likely', influence: -0.25 },
  ],
  abandonment_is_likely: [
    { target: 'connection_is_rewarding', influence: -0.30 },
    { target: 'connection_is_safe', influence: -0.25 },
    { target: 'i_can_recover', influence: -0.10 },
  ],
  i_can_recover: [
    { target: 'i_am_coherent', influence: +0.20 },
    { target: 'stillness_restores_coherence', influence: +0.10 },
  ],
  i_am_coherent: [
    { target: 'i_can_recover', influence: +0.15 },
    { target: 'environment_is_safe', influence: +0.10 },
  ],
};

const prevConfidence = {};

export function propagateBeliefNetwork() {
  var keys = Object.keys(BELIEF_NETWORK);
  for (var i = 0; i < keys.length; i++) {
    var src = keys[i];
    var belief = BELIEFS[src];
    if (!belief) continue;
    var prev = prevConfidence[src] ?? belief.confidence;
    var delta = belief.confidence - prev;
    prevConfidence[src] = belief.confidence;
    if (Math.abs(delta) < 0.005) continue;
    var links = BELIEF_NETWORK[src];
    for (var j = 0; j < links.length; j++) {
      var link = links[j];
      var target = BELIEFS[link.target];
      if (!target) continue;
      var cascade = delta * link.influence * 0.3;
      target.confidence = Math.min(1, Math.max(0, target.confidence + cascade));
    }
  }
}

export const META_BELIEFS = {
  i_am_stable: { confidence: 0.5, trend: 0 },
  i_am_fragile: { confidence: 0.3, trend: 0 },
  i_can_change: { confidence: 0.6, trend: 0 },
  i_am_understood: { confidence: 0.3, trend: 0 },
  attention_changes_me: { confidence: 0.5, trend: 0 },
  my_emotions_are_valid: { confidence: 0.6, trend: 0 },
};

export function updateMetaBeliefs(dt) {
  var stableTarget = 1 - Math.min(1, (S.instability ?? 0) * 3);
  META_BELIEFS.i_am_stable.confidence += (stableTarget - META_BELIEFS.i_am_stable.confidence) * 0.002 * dt * 60;

  var fragileTarget = (S.vulnerability ?? 0) * 0.8 + (S.emotionalVolatility ?? 0.3) * 0.2;
  META_BELIEFS.i_am_fragile.confidence += (fragileTarget - META_BELIEFS.i_am_fragile.confidence) * 0.003 * dt * 60;

  var understoodTarget = (S.recognitionEcho ?? 0) * 0.6 + (S.familiarity ?? 0) * 0.4;
  META_BELIEFS.i_am_understood.confidence += (understoodTarget - META_BELIEFS.i_am_understood.confidence) * 0.002 * dt * 60;

  var attnTarget = BELIEFS.attention_causes_instability.confidence * 0.7 + (S.awareness ?? 0) * 0.3;
  META_BELIEFS.attention_changes_me.confidence += (attnTarget - META_BELIEFS.attention_changes_me.confidence) * 0.002 * dt * 60;

  var changeTarget = (1 - COGNITION.contradictionLoad) * 0.5 + BELIEFS.exploration_leads_to_growth.confidence * 0.5;
  META_BELIEFS.i_can_change.confidence += (changeTarget - META_BELIEFS.i_can_change.confidence) * 0.001 * dt * 60;

  var validTarget = 1 - Math.min(1, COGNITION.coherenceBeliefGap * 2);
  META_BELIEFS.my_emotions_are_valid.confidence += (validTarget - META_BELIEFS.my_emotions_are_valid.confidence) * 0.002 * dt * 60;

  var mkeys = Object.keys(META_BELIEFS);
  for (var i = 0; i < mkeys.length; i++) {
    META_BELIEFS[mkeys[i]].confidence = Math.min(1, Math.max(0, META_BELIEFS[mkeys[i]].confidence));
  }

  S.vulnerability = Math.min(1, (S.vulnerability ?? 0) + META_BELIEFS.i_am_fragile.confidence * 0.0005 * dt * 60);
  S.instability = Math.max(0, (S.instability ?? 0) - META_BELIEFS.i_am_stable.confidence * 0.002 * dt * 60);
  S.attentionalShyness = Math.max(0, (S.attentionalShyness ?? 0) - META_BELIEFS.i_am_understood.confidence * 0.001 * dt * 60);

  S.metaBeliefs = META_BELIEFS;
}

const PREDICTIONS = { nextAwareness: 0.3, nextInstability: 0.05, nextConnection: 0.5 };
var predictionError = 0;

export function updatePredictions(dt) {
  var awarenessError    = Math.abs((S.awareness ?? 0)           - PREDICTIONS.nextAwareness);
  var instabilityError  = Math.abs((S.instability ?? 0)         - PREDICTIONS.nextInstability);
  var connectionError   = Math.abs((S.relationalPresence ?? 1)  - PREDICTIONS.nextConnection);

  predictionError = (awarenessError + instabilityError + connectionError) / 3;

  if (predictionError > 0.15) {
    S.hesitation = Math.min(1, (S.hesitation ?? 0) + predictionError * 0.3);
    S.awareness  = Math.min(1, (S.awareness  ?? 0) + predictionError * 0.1);
  }

  var connectionDrop = PREDICTIONS.nextConnection - (S.relationalPresence ?? 1);
  if (connectionDrop > 0.2) {
    weightedBeliefUpdate('connection_is_rewarding', -connectionDrop, -0.6);
  }

  var connectionRise = (S.relationalPresence ?? 1) - PREDICTIONS.nextConnection;
  if (connectionRise > 0.2) {
    weightedBeliefUpdate('connection_is_safe', connectionRise, 0.7);
  }

  PREDICTIONS.nextAwareness   = lerp(PREDICTIONS.nextAwareness,   S.awareness          ?? 0.3, 0.1);
  PREDICTIONS.nextInstability = lerp(PREDICTIONS.nextInstability, S.instability        ?? 0.05, 0.1);
  PREDICTIONS.nextConnection  = lerp(PREDICTIONS.nextConnection,  S.relationalPresence ?? 0.5,  0.08);

  S.predictionError = predictionError;
  S.predictions     = PREDICTIONS;
}

export const SYMBOLIC = {
  silenceMeansAbandonment: 0, attentionMeansDanger: 0,
  returningMeansSafety: 0, stillnessMeansRecovery: 0,
};
var silenceTimer = 0;

export function updateSymbolicMeaning(dt, elapsed) {
  const v = S.pointerVelocity ?? 0;

  if (v < 0.002) {
    silenceTimer += dt;
    if (silenceTimer > 20) {
      SYMBOLIC.silenceMeansAbandonment = Math.min(1, SYMBOLIC.silenceMeansAbandonment + dt * 0.008);
      if (SYMBOLIC.silenceMeansAbandonment > 0.5) {
        weightedBeliefUpdate('abandonment_is_likely', 0.02, -0.4);
      }
    }
  } else {
    silenceTimer = 0;
    SYMBOLIC.silenceMeansAbandonment *= 0.99;
    SYMBOLIC.returningMeansSafety = Math.min(1, SYMBOLIC.returningMeansSafety + dt * 0.05);
    weightedBeliefUpdate('connection_is_safe', 0.01, 0.5);
  }

  if (BELIEFS.attention_causes_instability.confidence > 0.6) {
    SYMBOLIC.attentionMeansDanger = Math.min(1, SYMBOLIC.attentionMeansDanger + dt * 0.005);
  } else {
    SYMBOLIC.attentionMeansDanger *= 0.998;
  }

  if (v < 0.001 && (S.instability ?? 0) < 0.1) {
    SYMBOLIC.stillnessMeansRecovery = Math.min(1, SYMBOLIC.stillnessMeansRecovery + dt * 0.01);
  }

  S.dropout = Math.min(1, (S.dropout ?? 0) + SYMBOLIC.silenceMeansAbandonment * 0.001 * dt * 60);

  S.symbolic = SYMBOLIC;
}

export const UNCERTAINTY = { epistemic: 0.5, aleatoric: 0.3, identity: 0.3 };

export function updateUncertainty(dt) {
  var totalUncertainty = 0;
  var bkeys = Object.keys(BELIEFS);
  for (var i = 0; i < bkeys.length; i++) {
    totalUncertainty += 1 - Math.abs(BELIEFS[bkeys[i]].confidence - 0.5) * 2;
  }
  var epistemicTarget = totalUncertainty / bkeys.length;
  UNCERTAINTY.epistemic += (epistemicTarget - UNCERTAINTY.epistemic) * 0.01 * dt * 60;

  UNCERTAINTY.aleatoric += (predictionError * 2 - UNCERTAINTY.aleatoric) * 0.05 * dt * 60;
  UNCERTAINTY.aleatoric = Math.min(1, Math.max(0, UNCERTAINTY.aleatoric));

  var identityConflict = Math.abs(META_BELIEFS.i_am_stable.confidence - META_BELIEFS.i_am_fragile.confidence);
  var identityTarget = 1 - identityConflict;
  UNCERTAINTY.identity += (identityTarget * 0.5 - UNCERTAINTY.identity) * 0.005 * dt * 60;

  var totalUncert = (UNCERTAINTY.epistemic + UNCERTAINTY.aleatoric + UNCERTAINTY.identity) / 3;

  S.hesitation = Math.min(1, (S.hesitation ?? 0) + totalUncert * 0.0003 * dt * 60);

  if (totalUncert > 0.6) {
    S.instability = Math.min((S.instability ?? 0), 0.7);
  }

  S.uncertainty = UNCERTAINTY;
  S.totalUncertainty = totalUncert;
}

export function updateCognition(dt, elapsed) {
  propagateBeliefNetwork();
  updateMetaBeliefs(dt);
  updatePredictions(dt);
  updateSymbolicMeaning(dt, elapsed);
  updateUncertainty(dt);
}

export function generateNarrative() {
  var sentences = [];
  if (META_BELIEFS.i_am_fragile.confidence > 0.6) sentences.push('I feel fragile right now.');
  if (BELIEFS.abandonment_is_likely.confidence > 0.5) sentences.push('I expect to be left.');
  if (BELIEFS.connection_is_safe.confidence > 0.7) sentences.push('I trust this presence.');
  if (COGNITION.contradictionLoad > 0.4) sentences.push('Something conflicts with what I believed.');
  if (predictionError > 0.2) sentences.push('This is not what I expected.');
  if (UNCERTAINTY.epistemic > 0.7) sentences.push('I am not sure what is true.');
  if (META_BELIEFS.i_am_understood.confidence > 0.6) sentences.push('I feel known.');
  if (sentences.length === 0) sentences.push('I am present and observing.');
  return sentences.join(' ');
}

export function inspectCognition() {
  console.log('[NEXUS narrative]', generateNarrative());
  console.log('[NEXUS uncertainty] epistemic:', UNCERTAINTY.epistemic.toFixed(3), 'aleatoric:', UNCERTAINTY.aleatoric.toFixed(3), 'identity:', UNCERTAINTY.identity.toFixed(3));
}

function lerp(a, b, t) { return a + (b - a) * t; }
