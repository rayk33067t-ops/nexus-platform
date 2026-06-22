let audioCtx;
let masterGain;
let filter;
let convolver;
let dryGain;
let wetGain;

let coreOsc,     coreGain;
let harmonicOsc, harmonicGain;
let shimmerOsc,  shimmerGain;
let subOsc,      subGain;

const EMOTION_PROFILES = {
  calm: { freqRange: [55, 130], waveform: 'sine', modDepth: 0.0, modRate: 0.0, filterHz: 400, masterLevel: 0.06, harmonicMix: 0.05, subMix: 0.30 },
  curious: { freqRange: [130, 300], waveform: 'sine', modDepth: 0.5, modRate: 1.2, filterHz: 700, masterLevel: 0.08, harmonicMix: 0.15, subMix: 0.20 },
  engaged: { freqRange: [300, 600], waveform: 'triangle', modDepth: 1.5, modRate: 2.8, filterHz: 1100, masterLevel: 0.10, harmonicMix: 0.25, subMix: 0.12 },
  tension: { freqRange: [600, 1200], waveform: 'sawtooth', modDepth: 4.0, modRate: 5.5, filterHz: 1600, masterLevel: 0.09, harmonicMix: 0.35, subMix: 0.05 },
  chaos: { freqRange: [200, 900], waveform: 'sawtooth', modDepth: 12.0, modRate: 8.0, filterHz: 1800, masterLevel: 0.12, harmonicMix: 0.50, subMix: 0.02 },
};

const current = {
  freq: 110, modDepth: 0, modRate: 0, filterHz: 400,
  masterLevel: 0, harmonicMix: 0.05, subMix: 0.25,
};

let lastSoundTime = 0;

function mapEmotion(S) {
  const energy = (S.awareness ?? 0) * 0.6 + (S.relationalPresence ?? 1) * 0.4;
  const chaos  = S.instability ?? 0;
  if (chaos  > 0.75) return 'chaos';
  if (energy < 0.25) return 'calm';
  if (energy < 0.50) return 'curious';
  if (energy < 0.80) return 'engaged';
  return 'tension';
}

function createImpulseResponse(duration = 3, decay = 2) {
  const sr     = audioCtx.sampleRate;
  const buf    = audioCtx.createBuffer(2, sr * duration, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, decay);
  }
  return buf;
}

export function initSound() {
  const start = () => {
    if (audioCtx) return;
    audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
    masterGain  = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    filter       = audioCtx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.8;

    convolver        = audioCtx.createConvolver();
    convolver.buffer = createImpulseResponse(3, 2);
    dryGain          = audioCtx.createGain();
    wetGain          = audioCtx.createGain();
    dryGain.gain.value = 0.80;
    wetGain.gain.value = 0.08;

    filter.connect(dryGain);
    filter.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);

    coreOsc  = audioCtx.createOscillator();
    coreGain = audioCtx.createGain();
    coreOsc.type = 'sine';
    coreGain.gain.value = 0;
    coreOsc.connect(coreGain);
    coreGain.connect(filter);

    harmonicOsc  = audioCtx.createOscillator();
    harmonicGain = audioCtx.createGain();
    harmonicOsc.type = 'sine';
    harmonicGain.gain.value = 0;
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(filter);

    shimmerOsc  = audioCtx.createOscillator();
    shimmerGain = audioCtx.createGain();
    shimmerOsc.type = 'sawtooth';
    shimmerGain.gain.value = 0;
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(filter);

    subOsc  = audioCtx.createOscillator();
    subGain = audioCtx.createGain();
    subOsc.type = 'sine';
    subGain.gain.value = 0;
    subOsc.connect(subGain);
    subGain.connect(filter);

    coreOsc.start();
    harmonicOsc.start();
    shimmerOsc.start();
    subOsc.start();

    document.removeEventListener('pointermove', start);
    document.removeEventListener('pointerdown', start);
  };
  document.addEventListener('pointermove', start, { once: true });
  document.addEventListener('pointerdown', start, { once: true });
}

export function updateSound({ S: stateObj, elapsed = 0 } = {}) {
  if (!audioCtx || !masterGain || !stateObj) return;

  const now    = audioCtx.currentTime;
  const dt     = Math.min(elapsed - lastSoundTime, 0.05);
  lastSoundTime = elapsed;
  const T      = 0.08;

  const zone    = mapEmotion(stateObj);
  const profile = EMOTION_PROFILES[zone];

  const lsp = dt * 0.8;
  const [fLo, fHi] = profile.freqRange;
  const targetFreq  = fLo + (fHi - fLo) * 0.5;

  current.freq        += (targetFreq        - current.freq)        * lsp;
  current.modDepth    += (profile.modDepth  - current.modDepth)    * lsp;
  current.modRate     += (profile.modRate   - current.modRate)     * lsp;
  current.filterHz    += (profile.filterHz  - current.filterHz)    * lsp;
  current.masterLevel += (profile.masterLevel - current.masterLevel) * lsp;
  current.harmonicMix += (profile.harmonicMix - current.harmonicMix) * lsp;
  current.subMix      += (profile.subMix    - current.subMix)      * lsp;

  const pulse = 0.92 + Math.sin(elapsed * 0.8) * 0.04 + Math.sin(elapsed * 1.7) * 0.02;

  const drift = Math.sin(elapsed * 0.11) * current.modDepth
              + Math.sin(elapsed * 0.07 + 1.3) * current.modDepth * 0.5;

  coreOsc.frequency.setTargetAtTime(current.freq + drift,          now, T);
  harmonicOsc.frequency.setTargetAtTime(current.freq * 2 + drift,  now, T);
  shimmerOsc.frequency.setTargetAtTime(current.freq * 3 - drift,   now, T);
  subOsc.frequency.setTargetAtTime(current.freq * 0.5,             now, T);

  masterGain.gain.setTargetAtTime(current.masterLevel * pulse, now, T);
  coreGain.gain.setTargetAtTime(0.40 * pulse, now, T);
  harmonicGain.gain.setTargetAtTime(current.harmonicMix, now, T);
  shimmerGain.gain.setTargetAtTime(
    zone === 'tension' || zone === 'chaos' ? current.harmonicMix * 0.4 : 0,
    now, T
  );
  subGain.gain.setTargetAtTime(current.subMix * pulse, now, T);

  filter.frequency.setTargetAtTime(current.filterHz, now, zone === 'chaos' ? 0.04 : 0.15);

  const wetTarget = 0.04 + (zone === 'calm' || zone === 'curious' ? 0.08 : 0.03);
  if (wetGain) wetGain.gain.setTargetAtTime(wetTarget, now, 0.2);
}
