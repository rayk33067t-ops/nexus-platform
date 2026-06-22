// ─── MAIN.JS — THE HEARTBEAT ──────────────────────────────────────────────────
import { S, updatePointer } from './state.js';
import { uniforms, voidMesh, render, setBloom } from './orb.js';
import { updateBehavior, driver } from './behavior.js';
import { updateDrift, getDriftState } from './drift.js';
import { loadMemory, saveMemory, resetMemory, inspectMemory } from './memory.js';

const sessionStart = performance.now();
loadMemory();

window.addEventListener('beforeunload', () => {
  saveMemory((performance.now() - sessionStart) / 1000);
});

window.nexusReset   = resetMemory;
window.nexusMemory  = inspectMemory;
import { initSound, updateSound } from './sound.js';

window.addEventListener('pointermove', (e) => {
  updatePointer(
    (e.clientX / window.innerWidth)  *  2 - 1,
   -((e.clientY / window.innerHeight) * 2 - 1)
  );
});

initSound();

let lastTick = performance.now();

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  const elapsed = now * 0.001;
  const dt      = Math.min((now - lastTick) * 0.001, 0.05);
  lastTick      = now;

  S.time  = elapsed;
  S.delta = dt;

  const behavior = updateBehavior(elapsed, dt);
  updateDrift(dt);

  voidMesh.material.opacity = 0.18 + Math.sin(elapsed * 0.05) * 0.015;

  const arousal  = S.emotion?.arousal ?? 0;
  const distress = Math.min(1, S.instability * S.vulnerability);
  const curiosity = S.recognitionEcho * 0.5 + S.awareness * 0.3;

  setBloom({
    strength:  0.8 + S.awareness * 2.4 + distress * 1.2,
    radius:    0.2 + curiosity * 0.5,
    threshold: Math.max(0.05, 0.18 - S.awareness * 0.08),
  });

  uniforms.uEmissiveBoost.value = 1.0 + S.awareness * 1.5 + distress * 0.8;

  updateSound({ S, elapsed });

  uniforms.uTime.value            = driver.time;
  uniforms.uBreath.value          = driver.breath;
  uniforms.uVelocity.value        = driver.velocity;
  uniforms.uPointer.value.set(driver.pointer.x, driver.pointer.y);
  uniforms.uAwareness.value       = driver.awareness;
  uniforms.uInstability.value     = driver.instability;
  uniforms.uBreathingRadius.value = driver.breathRadius;
  uniforms.uStateColor.value.setRGB(driver.stateR, driver.stateG, driver.stateB);
  uniforms.uEmotionColor.value.setRGB(driver.emotionR, driver.emotionG, driver.emotionB);
  uniforms.uEmotionWeight.value   = driver.emotion;
  uniforms.uFragmentation.value   = driver.fragmentation;
  uniforms.uEvolutionStage.value  = driver.evolutionStage ?? 1.0;
  render();
}

animate();
