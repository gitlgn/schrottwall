// Ton: alles wird im Browser erzeugt (WebAudio), es gibt keine Sounddateien.
// Effekte = kurze Kombinationen aus Tönen und gefiltertem Rauschen, Musik = Schrittsequenzer
// mit Bass, Schlagzeug und Melodie, der je nach Spiellage dichter wird.

let ctx: AudioContext | null = null;
let sfxBus: GainNode;
let musicBus: GainNode;
let noiseBuf: AudioBuffer;

// 0 = alles an, 1 = nur Effekte, 2 = stumm
let mode = 0;
try { mode = Number(localStorage.getItem('schrottwall.audio')) || 0; } catch { /* privates Fenster */ }

const SFX_VOL = 0.5;
const MUSIC_VOL = 0.2;

function applyMode() {
  if (!ctx) return;
  sfxBus.gain.value = mode < 2 ? SFX_VOL : 0;
  musicBus.gain.value = mode === 0 ? MUSIC_VOL : 0;
}
export function audioMode() { return mode; }
export function cycleAudioMode() {
  mode = (mode + 1) % 3;
  try { localStorage.setItem('schrottwall.audio', String(mode)); } catch { /* privates Fenster */ }
  applyMode();
}

/** Beim ersten Tipp aufrufen: Browser erlauben Ton erst nach einer Eingabe. */
export function unlockAudio() {
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { return; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.connect(ctx.destination);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(comp);
    musicBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyMode();
    nextStep = ctx.currentTime + 0.1;
    setInterval(schedule, 30);
  }
  ctx.resume();
}

// ---------- Bausteine ----------
function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, at = 0, bus: GainNode = sfxBus) {
  const t = ctx!.currentTime + at;
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function noise(filter: BiquadFilterType, f0: number, f1: number, dur: number, vol: number, at = 0, bus: GainNode = sfxBus) {
  const t = ctx!.currentTime + at;
  const s = ctx!.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ctx!.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx!.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(t, Math.random());
  s.stop(t + dur + 0.02);
}

// ---------- Effekte ----------
// p = optionaler Parameter (Stufe der Disc, Kombo, Energie …)
const SFX: Record<string, (p: number) => void> = {
  // Disc
  throw: (p) => { noise('bandpass', 900, 3200, 0.14, 0.35); tone('sawtooth', 260 + p * 90, 800 + p * 220, 0.12, 0.12); },
  bounce: () => { tone('triangle', 1500, 900, 0.05, 0.2); tone('square', 2600, 2000, 0.03, 0.05); },
  cut: () => { tone('triangle', 1900, 1200, 0.04, 0.14); },
  catch: () => { tone('triangle', 330, 420, 0.07, 0.3); noise('highpass', 3000, 3000, 0.03, 0.12); },
  perfect: (p) => {
    const base = 660 + p * 110;
    tone('square', base, base, 0.08, 0.18);
    tone('square', base * 1.5, base * 1.5, 0.1, 0.18, 0.06);
    tone('triangle', base * 2, base * 2, 0.22, 0.22, 0.12);
    noise('highpass', 5000, 9000, 0.18, 0.1, 0.02);
  },
  miss: () => { tone('sawtooth', 190, 55, 0.3, 0.22); noise('lowpass', 500, 120, 0.2, 0.25); },
  pickup: () => { tone('triangle', 220, 340, 0.08, 0.25); },
  // Treffer und Blut
  hit: () => { noise('lowpass', 1400, 300, 0.08, 0.5); tone('sawtooth', 240, 90, 0.08, 0.2); tone('square', 1700, 1300, 0.03, 0.06); },
  kill: (p) => {
    noise('lowpass', 900, 110, 0.3, 0.7);
    tone('sine', 190, 45, 0.25, 0.5);
    tone('square', 300 + p * 80, 600 + p * 120, 0.09, 0.1, 0.03);
  },
  explode: () => { noise('lowpass', 2400, 60, 0.7, 1); tone('sine', 130, 28, 0.6, 0.9); noise('highpass', 2000, 800, 0.15, 0.3); },
  hurt: () => { tone('sawtooth', 170, 50, 0.22, 0.35); noise('lowpass', 800, 200, 0.15, 0.45); },
  // Gegner
  shot: () => { tone('square', 560, 150, 0.07, 0.11); noise('highpass', 2500, 1500, 0.04, 0.16); },
  shotTank: () => { tone('sine', 170, 40, 0.3, 0.7); noise('lowpass', 1200, 150, 0.25, 0.6); },
  shotSniper: () => { tone('sawtooth', 2200, 260, 0.14, 0.22); noise('highpass', 4000, 1500, 0.1, 0.3); },
  alert: () => { tone('square', 300, 620, 0.14, 0.18); tone('square', 300, 620, 0.14, 0.18, 0.16); },
  // Deckung und Bewegung
  coverHit: () => { noise('bandpass', 1800, 900, 0.05, 0.3); tone('triangle', 320, 200, 0.05, 0.14); },
  coverBreak: () => { noise('lowpass', 1600, 100, 0.5, 0.8); tone('sawtooth', 200, 45, 0.35, 0.3); },
  slide: () => { noise('bandpass', 700, 220, 0.32, 0.4); },
  thud: () => { tone('sine', 120, 55, 0.1, 0.5); noise('lowpass', 400, 150, 0.06, 0.25); },
  sprint: () => { noise('highpass', 1500, 3500, 0.2, 0.14); },
  // Nahkampf
  clashStart: () => { tone('sawtooth', 110, 520, 0.45, 0.3); noise('bandpass', 400, 2000, 0.45, 0.3); },
  tap: (p) => { tone('square', 380 + p * 520, 380 + p * 520, 0.05, 0.14); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.16, 0.18, i * 0.09)); },
  lose: () => { tone('sawtooth', 220, 36, 0.9, 0.4); noise('lowpass', 600, 60, 0.9, 0.5); },
  levelDone: () => { [523, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.2, 0.26, i * 0.1)); },
  // Boss
  bossCatch: () => { tone('square', 180, 420, 0.14, 0.22); noise('bandpass', 600, 1500, 0.1, 0.2); },
  bossThrow: () => { tone('sawtooth', 520, 150, 0.2, 0.25); noise('bandpass', 2500, 700, 0.2, 0.3); },
  bossFan: () => { tone('square', 280, 110, 0.18, 0.2); noise('highpass', 2000, 1200, 0.1, 0.2); },
  bossHurt: () => { tone('sawtooth', 150, 60, 0.3, 0.45); noise('lowpass', 1500, 200, 0.2, 0.6); tone('square', 90, 70, 0.3, 0.2); },
};
export type SfxName = keyof typeof SFX;

// gleiche Effekte nicht öfter als alle 35 ms, sonst übersteuern Salven
const lastPlayed: Record<string, number> = {};
export function sfx(name: string, p = 0) {
  if (!ctx || mode === 2) return;
  const now = ctx.currentTime;
  if (now - (lastPlayed[name] ?? -1) < 0.035) return;
  lastPlayed[name] = now;
  SFX[name]?.(p);
}

// ---------- Musik ----------
// d-Moll, 108 Schläge pro Minute, Schleife über vier Takte. intensity: 0 = Pause/Menü (nur Puls),
// 1 = Kampf (Bass, Schlagzeug, leise Melodie), 2 = Boss/Nahkampf (dichter, Melodie vorne).
let intensity = 0;
export function setMusicIntensity(i: number) { intensity = i; }

const STEP = 60 / 108 / 4;
const ROOTS = [38, 38, 34, 36]; // D2, D2, B♭1, C2
const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
const LEAD = [
  [0, -1, 3, -1, 5, -1, 3, 0, -1, 7, -1, 5, 3, -1, 0, -1],
  [0, -1, 3, -1, 5, -1, 7, 8, -1, 7, -1, 5, 3, -1, 5, -1],
  [0, -1, 4, -1, 7, -1, 4, 0, -1, 9, -1, 7, 4, -1, 0, -1],
  [0, -1, 3, -1, 7, -1, 10, 7, -1, 5, -1, 3, 2, -1, -2, -1],
];
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

let nextStep = 0;
let stepNo = 0;
function schedule() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextStep < ctx.currentTime) nextStep = ctx.currentTime + 0.05; // nach einer Pause nicht nachholen
  while (nextStep < ctx.currentTime + 0.12) {
    if (mode === 0) playStep(stepNo, nextStep - ctx.currentTime);
    nextStep += STEP;
    stepNo = (stepNo + 1) % 64;
  }
}
function playStep(n: number, at: number) {
  const s = n % 16;
  const bar = Math.floor(n / 16);
  const root = ROOTS[bar];
  const I = intensity;
  // Bass
  if (I === 0) {
    if (s === 0) tone('triangle', hz(root), hz(root), STEP * 12, 0.5, at, musicBus);
  } else if (BASS[s]) {
    const f = hz(root + (I === 2 && s % 8 === 6 ? 12 : 0));
    tone('sawtooth', f, f, STEP * 1.6, 0.34, at, musicBus);
    tone('square', f / 2, f / 2, STEP * 1.6, 0.22, at, musicBus);
  }
  // Schlagzeug
  const kick = I === 0 ? s === 0 : s % 4 === 0 || (I === 2 && (s === 10 || s === 15));
  if (kick) { tone('sine', 150, 42, 0.16, 0.9, at, musicBus); }
  if (I >= 1 && (s === 4 || s === 12)) {
    noise('bandpass', 1800, 1200, 0.12, 0.5, at, musicBus);
    tone('triangle', 210, 150, 0.08, 0.3, at, musicBus);
  }
  const hat = I === 0 ? s % 8 === 4 : I === 1 ? s % 2 === 0 : true;
  if (hat) noise('highpass', 7000, 7000, 0.03, s % 4 === 2 ? 0.2 : 0.1, at, musicBus);
  // Melodie
  const note = LEAD[bar][s];
  if (I >= 1 && note !== -1 && (I === 2 || bar % 2 === 1)) {
    const f = hz(root + 24 + note);
    tone('square', f, f, STEP * 1.8, I === 2 ? 0.17 : 0.09, at, musicBus);
  }
}
