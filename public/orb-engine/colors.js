export const COLORS = {
  dormant:   [0.020, 0.031, 0.086],
  aware:     [0.000, 0.733, 1.000],
  focused:   [0.875, 0.965, 1.000],
  creative:  [0.710, 0.216, 1.000],
  emotional: [1.000, 0.294, 0.431],
  stable:    [0.000, 1.000, 0.702],
  evolving:  [1.000, 0.820, 0.400],
  corrupted: [0.478, 0.000, 0.000],
  ascended:  [1.000, 1.000, 1.000],
};

export function deriveColorState({
  awareness = 0, instability = 0, familiarity = 0,
  relationalPresence = 1, vulnerability = 0,
  reassurance = 0, calmMemory = 0,
} = {}) {
  if (instability > 0.18) {
    return { primary: COLORS.corrupted, secondary: COLORS.emotional, weight: Math.min(1, (instability - 0.18) * 8), name: 'corrupted' };
  }
  const ascendScore = familiarity * reassurance * calmMemory;
  if (ascendScore > 0.6) {
    return { primary: COLORS.ascended, secondary: COLORS.evolving, weight: Math.min(1, (ascendScore - 0.6) * 2.5), name: 'ascended' };
  }
  if (familiarity > 0.5 && relationalPresence > 1.1) {
    return { primary: COLORS.evolving, secondary: COLORS.focused, weight: (familiarity - 0.5) * 2, name: 'evolving' };
  }
  if (calmMemory > 0.4 && reassurance > 0.3) {
    return { primary: COLORS.stable, secondary: COLORS.aware, weight: Math.min(1, calmMemory * reassurance * 3), name: 'stable' };
  }
  if (vulnerability > 0.15) {
    return { primary: COLORS.aware, secondary: COLORS.emotional, weight: Math.min(1, (vulnerability - 0.15) * 5), name: 'emotional' };
  }
  if (awareness > 0.6 && instability < 0.05) {
    return { primary: COLORS.focused, secondary: COLORS.aware, weight: Math.min(1, (awareness - 0.6) * 2.5), name: 'focused' };
  }
  if (awareness > 0.25) {
    return { primary: COLORS.aware, secondary: COLORS.focused, weight: Math.min(1, awareness * 1.5), name: 'aware' };
  }
  return { primary: COLORS.dormant, secondary: COLORS.aware, weight: awareness * 0.4, name: 'dormant' };
}

export function lerpColor(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform float uBreath;
  uniform vec2  uPointer;
  uniform float uVelocity;
  uniform float uAwareness;
  uniform float uInstability;
  uniform float uBreathingRadius;
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position * uBreathingRadius;
    float t  = uTime * 0.08;
    float noiseA = snoise(pos * 1.4 + t);
    float noiseB = snoise(pos * 2.2 - t * 0.6);
    float livingNoise = noiseA * 0.7 + noiseB * 0.3;
    float instabilityNoise = snoise(pos * 3.8 + t * 0.17);
    float coherenceBreakup = instabilityNoise * uInstability * 0.0075;
    float instability  = uVelocity * 0.012;
    float displacement = livingNoise * (0.008 + instability) + coherenceBreakup;
    float breath       = uBreath * 0.018;
    vec2  projected        = normalize(pos.xy);
    float pointerInfluence = 1.0 - smoothstep(0.0, 1.4, distance(projected, uPointer));
    float compression      = pointerInfluence * 0.012;
    float tensionPull      = uAwareness * 0.003;
    pos += normal * displacement;
    pos += normal * breath;
    pos -= normal * compression;
    pos -= normal * tensionPull;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition     = worldPosition.xyz;
    vec4 mvPosition    = viewMatrix * worldPosition;
    vViewPosition      = -mvPosition.xyz;
    gl_Position        = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform float uBreath;
  uniform float uVelocity;
  uniform float uAwareness;
  uniform float uInstability;
  uniform vec3  uStateColor;
  uniform vec3  uEmotionColor;
  uniform float uEmotionWeight;
  uniform float uFragmentation;
  uniform float uEmissiveBoost;
  void main() {
    vec3  normal  = normalize(vNormal);
    vec3  viewDir = normalize(vViewPosition);
    float fresnelExp = 2.8 + uAwareness * 0.4;
    float fresnel    = pow(1.0 - abs(dot(viewDir, normal)), fresnelExp);
    float radialDepth = pow(1.0 - abs(dot(viewDir, normal)), 1.2);
    float emotionMask  = 0.5 + 0.5 * sin(vWorldPosition.x * 3.1 + uTime * 0.4) * cos(vWorldPosition.y * 2.7 - uTime * 0.3);
    emotionMask = pow(emotionMask, 2.0);
    float localizedWeight = uEmotionWeight * (0.4 + emotionMask * 0.6);
    vec3 core = uStateColor * 0.12;
    vec3 edge = uStateColor * 0.85;
    vec3 emotionVein = mix(edge, uEmotionColor, localizedWeight * fresnel * 0.6);
    vec3 base = mix(core, emotionVein, radialDepth * 0.75);
    float breathGlow    = smoothstep(1.0, -1.0, uBreath) * 0.07;
    float stabilityGlow = (1.0 - clamp(uVelocity * 2.0, 0.0, 1.0)) * 0.04;
    float coreDim       = smoothstep(-1.0, 1.0, uBreath) * 0.55;
    base = mix(base, base * 0.25, coreDim);
    vec3 rimColor  = mix(uStateColor, uEmotionColor, uEmotionWeight * 0.4);
    vec3 fresnelGlow = rimColor * fresnel * (0.55 + breathGlow + stabilityGlow);
    float fragR = pow(1.0 - abs(dot(viewDir, normal + vec3(uFragmentation * 0.02, 0.0, 0.0))), fresnelExp);
    float fragB = pow(1.0 - abs(dot(viewDir, normal - vec3(uFragmentation * 0.02, 0.0, 0.0))), fresnelExp);
    fresnelGlow.r += fragR * uFragmentation * 0.08;
    fresnelGlow.b += fragB * uFragmentation * 0.08;
    vec3 emissive = (base + fresnelGlow) * (1.0 + uEmissiveBoost);
    gl_FragColor = vec4(emissive, 1.0);
  }
`;

export const EVOLUTION = {
  stage: 1, progress: 0,
  thresholds: [0, 0.08, 0.22, 0.45, 0.75],
  names: ['', 'Primitive', 'Aware', 'Emotional', 'Conscious', 'Transcendent'],
};

export function updateEvolution(familiarity, sessionMinutes) {
  const score = familiarity * sessionMinutes;
  for (let i = 4; i >= 1; i--) {
    if (score >= EVOLUTION.thresholds[i]) {
      EVOLUTION.stage    = i + 1;
      EVOLUTION.progress = Math.min(1, (score - EVOLUTION.thresholds[i]) / ((EVOLUTION.thresholds[i] - EVOLUTION.thresholds[i - 1]) || 0.1));
      return EVOLUTION.stage + EVOLUTION.progress - 1;
    }
  }
  EVOLUTION.stage    = 1;
  EVOLUTION.progress = Math.min(1, score / EVOLUTION.thresholds[1]);
  return EVOLUTION.stage + EVOLUTION.progress - 1;
}
