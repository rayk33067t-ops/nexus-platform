import { S } from './state.js';
import { EVOLUTION } from './colors.js';

const STORAGE_KEY = 'nexus_orb_identity_v1';

const PERSIST_FIELDS = {
  personality: { curiosity: 0.5, empathy: 0.5, resilience: 0.5, introversion: 0.5, volatility: 0.3, warmth: 0.5 },
  relational: { familiarity: 0.0, totalAttachmentTime: 0.0, sessionCount: 0, lastSessionAge: 0 },
  drift: { coherence: 0.7, emotionalVolatility: 0.5, trustBias: 0.5, explorationBias: 0.5, stabilityBias: 0.5 },
  evolution: { stage: 1, progress: 0 },
  meta: { lastSeen: null, totalTime: 0 },
};

export function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);

    if (saved.personality && S.personality) {
      const p = saved.personality;
      for (const k of Object.keys(PERSIST_FIELDS.personality)) {
        if (p[k] !== undefined) {
          S.personality[k] = p[k];
        }
      }
    }

    if (saved.relational) {
      S.familiarity        = Math.min(1, saved.relational.familiarity ?? 0);
      S.relationalPresence = 0.5 + (saved.relational.familiarity ?? 0) * 0.3;
      S.reassurance        = (saved.relational.familiarity ?? 0) * 0.4;
    }

    if (saved.drift) {
      for (const [k, v] of Object.entries(saved.drift)) {
        S[k] = v;
      }
    }

    if (saved.evolution) {
      EVOLUTION.stage    = saved.evolution.stage    ?? 1;
      EVOLUTION.progress = saved.evolution.progress ?? 0;
    }

    if (saved.meta?.lastSeen) {
      const msSince = Date.now() - new Date(saved.meta.lastSeen).getTime();
      const hoursSince = msSince / (1000 * 60 * 60);

      if (hoursSince > 24) {
        S.attentionalShyness = Math.min(0.4, hoursSince / 200);
        S.dropout            = Math.min(0.2, hoursSince / 500);
      } else if (hoursSince < 1) {
        S.reassurance    = Math.min(1, S.reassurance + 0.2);
        S.relationalPresence = Math.min(1.2, S.relationalPresence + 0.1);
      }
    }

    return saved;
  } catch (err) {
    console.warn('[NEXUS memory] Load failed:', err.message);
    return null;
  }
}

export function saveMemory(sessionSeconds = 0) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

    const data = {
      personality: S.personality ? { ...S.personality } : PERSIST_FIELDS.personality,
      relational: {
        familiarity:         S.familiarity         ?? 0,
        totalAttachmentTime: (existing.relational?.totalAttachmentTime ?? 0) + sessionSeconds * S.familiarity,
        sessionCount:        (existing.relational?.sessionCount        ?? 0) + 1,
        lastSessionAge:      sessionSeconds,
      },
      drift: {
        coherence:           S.coherence           ?? 0.7,
        emotionalVolatility: S.emotionalVolatility ?? 0.5,
        trustBias:           S.trustBias           ?? 0.5,
        explorationBias:     S.explorationBias     ?? 0.5,
        stabilityBias:       S.stabilityBias       ?? 0.5,
      },
      evolution: { stage: EVOLUTION.stage, progress: EVOLUTION.progress },
      meta: {
        lastSeen:  new Date().toISOString(),
        totalTime: (existing.meta?.totalTime ?? 0) + sessionSeconds,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('[NEXUS memory] Save failed:', err.message);
    return null;
  }
}

export function resetMemory() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[NEXUS memory] Identity reset. Reload to start fresh.');
}

export function inspectMemory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { console.log('[NEXUS memory] No saved identity.'); return null; }
  const data = JSON.parse(raw);
  console.log('[NEXUS memory]', data);
  return data;
}
