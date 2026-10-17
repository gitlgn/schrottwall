// Schrottwall – Wurf/Fang-Prototyp
// Eine Arena, eine Disc, ein Gegnertyp. Alles zum Drehen steht in T.
import { initTuner } from './tuner';
import { audioMode, cycleAudioMode, setMusicIntensity, sfx, unlockAudio } from './audio';

const T = {
  W: 360, // logische Breite; Höhe ergibt sich aus dem Seitenverhältnis
  topY: 46,

  // Die Disc hängt an einer Kette: fliegt bis die Kette aus ist oder sie trifft, dann schnellt sie zurück
  discR: 9,
  // Stufe der Disc (0 = Anfänger, steigt mit jedem PERFEKT, fällt bei DANEBEN auf 0):
  // höhere Stufe = mehr Schaden und schneller, dafür ist der Fang schwerer (kleinere, weiter entfernte Zone).
  levels: [
    { dmg: 1, speed: 560, ret: 400, zone: 1.3, off: 0.7 },
    { dmg: 2, speed: 700, ret: 500, zone: 1.0, off: 1.0 },
    { dmg: 3, speed: 820, ret: 600, zone: 0.85, off: 1.2 },
    { dmg: 4, speed: 900, ret: 700, zone: 0.7, off: 1.4 },
  ],
  chainLen: 600, // Flugweg inkl. Abpraller
  chainPerLevel: 40,
  maxLevel: 3,
  // Fangzone: Die Disc kommt nicht zur Hand zurück, sondern landet seitlich versetzt auf der Reihe der Figur.
  // Steht die Figur bei der Landung in der Zone, fängt sie automatisch und PERFEKT. Sonst bleibt die Disc liegen.
  // Versatz und Größe hängen davon ab, wer die Disc zurückschickt (min/max = Abstand zur Figur, r = Radius).
  catchZone: {
    none: { min: 34, max: 60, r: 24 }, // nichts getroffen
    grunt: { min: 45, max: 85, r: 26 },
    boss: { min: 90, max: 150, r: 28 },
  },
  pickupR: 22, // so nah muss die Figur an eine liegende Disc
  unstickCatch: 0.1, // solange die Disc unterwegs ist, löst sich die Figur fast sofort von der Deckung

  playerSpeed: 340,
  playerSpeedMin: 130, // Antippen = Feinjustierung, Halten beschleunigt
  playerRamp: 0.16,
  aimSteep: 18, // Wurfwinkel in Grad ab der Senkrechten
  aimDiag: 38,
  aimFlat: 62,
  ctrlH: 150, // Höhe der Bedienleiste

  playerHp: 100,
  regenDelay: 4, // Sekunden ohne Treffer, bis Leben zurückkommt
  regenDelayCover: 1.5, // in Deckung deutlich früher
  regenRate: 14,

  // Deckung: halb magnetisch. Kreuz loslassen in Reichweite = andocken, Feuer = heraustreten und werfen
  snapRange: 10, // zusätzlich zur halben Deckungsbreite
  slideRange: 80, // im vollen Lauf loslassen: aus dieser Entfernung rutscht die Figur in die Deckung voraus
  slideMinRun: 0.35, // so lange muss sie vorher gelaufen sein, damit Loslassen ein Rutschen auslöst
  unstick: 0.05, // so lange Richtung halten, um aus der Deckung zu treten (ein kurzer Tipp reicht)
  popOffset: 14, // Abstand neben der Deckungskante beim Heraustreten
  popSpeed: 520,
  rowHold: 0.18, // so lange nur hoch/runter halten, bis die Figur die Reihe wechselt
  sprintSpeed: 420,
  rowSlide: 60, // die letzten Pixel vor der Deckung rutscht sie

  enemyR: 16, // Grundmaß für die Stellungen an den Deckungen
  // Gegnertypen. r = Größe, walk/peek = Lauf- und Heraustret-Tempo, hide = Zeit in Deckung,
  // aim = Vorwarnzeit, burst = Schüsse pro Salve, gap = Abstand zwischen den Schüssen,
  // shot* = Tempo/Schaden/Größe der Kugel, coverDmg = Schaden an zerstörbarer Deckung.
  kinds: {
    // Standard: hockt in Deckung, tritt heraus, feuert Salven
    grunt: { r: 16, hp: 3, walk: 70, peek: 95, hideMin: 0.6, hideMax: 1.6, aim: 0.5, burstMin: 5, burstMax: 8, gap: 0.13, spread: 0.1, shotSpeed: 260, shotDmg: 9, coverDmg: 1, shotR: 4.5, score: 10 },
    // Selbstzerstörer: rennt ohne Deckung auf die Figur zu und explodiert (ab Level 4)
    bomber: { r: 13, hp: 2, walk: 105, peek: 0, hideMin: 0, hideMax: 0, aim: 0, burstMin: 0, burstMax: 0, gap: 0, spread: 0, shotSpeed: 0, shotDmg: 0, coverDmg: 0, shotR: 0, score: 15 },
    // Panzer: wenige, zäh, langsame schwere Schüsse, die Deckung schnell zerlegen (ab Level 7)
    tank: { r: 21, hp: 10, walk: 45, peek: 60, hideMin: 1.4, hideMax: 2.6, aim: 0.9, burstMin: 2, burstMax: 3, gap: 0.45, spread: 0.04, shotSpeed: 200, shotDmg: 25, coverDmg: 6, shotR: 8, score: 40 },
    // Scharfschütze: bleibt ganz hinten, zielt lange und sichtbar, ein schneller harter Schuss (ab Level 11)
    sniper: { r: 13, hp: 2, walk: 70, peek: 110, hideMin: 2, hideMax: 3.5, aim: 1.3, burstMin: 1, burstMax: 1, gap: 0.2, spread: 0, shotSpeed: 560, shotDmg: 35, coverDmg: 4, shotR: 3.5, score: 30 },
  },
  bomberBlastR: 62, // Explosionsradius: trifft die Figur und andere Gegner
  bomberDmg: 30,
  bomberEnemyDmg: 3,
  bomberCoverDmg: 12, // wenn die Deckung die Explosion abfängt
  bomberMax: 2, // gleichzeitig unterwegs

  // Nahkampf: Gegner an derselben Deckung springt nach kurzer Zeit herüber; Berührung startet das Minispiel
  vaultDelay: 1.5,
  chargeSpeed: 150,
  chargeTime: 3, // so lange verfolgt er, dann zurück in Deckung
  clashTime: 10, // Sekunden durchhalten
  clashStart: 0.6, // Energie zu Beginn (0..1)
  clashDrainStart: 0.28, // Energieverlust pro Sekunde am Anfang …
  clashDrainEnd: 0.45, // … und am Ende
  clashTap: 0.075, // Energie pro Feuer-Tipp
  clashScore: 50,

  // Zerstörbare Deckung (erste und zweite Reihe): jede Kugel kostet 1, zu Wellenbeginn wieder ganz
  coverHp: 36,

  // Boss: fängt die ungeladene Disc und schleudert sie zurück. Nur ein PERFEKT gefangener,
  // also aufgeladener Wurf verletzt ihn (Schaden = Stufe).
  bossR: 30,
  bossHp: 12,
  bossSpeed: 60,
  bossHold: 0.6, // so lange hält er die Disc, bevor er wirft
  bossThrowSpeed: 360,
  bossThrowGain: 20, // jeder Rückwurf wird schneller …
  bossThrowMax: 520, // … bis hierher
  bossFanGap: 3.5, // Abstand zwischen den Fächer-Salven
  bossFanWarn: 0.5,
  bossFanCount: 7,
  bossFanSpread: 0.5,
  bossFanSpeed: 260,
  bossFanDmg: 9,
  bossHpPerTier: 6, // jeder weitere Boss (Level 20, 30 …) hält so viel mehr aus
  bossScore: 300,
  maxAimers: 3, // so viele Gegner dürfen gleichzeitig aus der Deckung
  lanes: [127, 233], // freie Laufgassen zwischen den Deckungen
  spawnGap: 1.8,

  maxConcurrent: 5, // Gegner gleichzeitig in Deckungen (Selbstzerstörer zählen extra)
  waveBreak: 2.5,
  waveHeal: 30,

  hitStop: 0.07,

  // Beute: fällt beim Abschuss auf die nächste Reihe vor dem Gegner. Hinlaufen oder mit der Disc einsammeln.
  coinChance: 0.7,
  coinsPer: { grunt: 1, bomber: 1, tank: 3, sniper: 2, boss: 10 },
  heartChance: 0.1,
  heal: 25,
  brickChance: 0.22,
  maxBricks: 5,
  dropLife: 9, // Sekunden, bis Beute verschwindet (die letzten zwei blinkt sie)
  // Reparatur: ein Ziegel stellt diesen Anteil der Deckung wieder her, auch eine zerschossene
  brickRepair: 0.5,
  repairTime: 2,

  checkpointEvery: 5, // Level 1, 6, 11 … werden beim Erreichen als Startpunkt freigeschaltet

  // Hitze: jeder Wurf heizt die Säge auf, sie kühlt in der Hand schneller ab als im Flug.
  // Bei voller Hitze kurze Zwangspause. Später über Upgrades verbesserbar.
  heatPerThrow: 0.25,
  heatCoolHeld: 0.4, // pro Sekunde
  heatCoolFly: 0.12,
  overheatTime: 1.8,

  // Wer zu lange ungedeckt steht, wird gezielt beschossen
  exposedAfter: 2, // Sekunden im Freien
  exposedAimMul: 0.5, // kürzere Vorwarnung …
  exposedHideMul: 0.4, // … kürzere Pausen in Deckung …
  exposedExtraAimers: 2, // … und mehr Gegner gleichzeitig draußen

  // Seitentore: ab diesem Level kommen manche Gegner aus den Seitenwänden statt von oben
  sideGateFrom: 11,
  sideGateChance: 0.4,

  // Höllentor vor jedem Gegner: so lange steigt er heraus, danach schließt es sich
  portalTime: 0.7,
  portalClose: 0.35,
};

const LEVEL_COLORS = ['#ffffff', '#3fd4ff', '#ffd23f', '#ff4fa3'];

type DiscState = 'held' | 'fly' | 'return' | 'down' | 'boss'; // down = liegt am Boden, boss = der Boss hält sie
type ZoneKind = keyof typeof T.catchZone;
type EnemyState = 'move' | 'hide' | 'out' | 'aim' | 'back' | 'charge';
type EnemyKind = keyof typeof T.kinds;
// x/y = Mitte. weight > 0 = Gegner nutzen sie (von oben), row >= 0 = Spieler nutzt sie (von unten) in dieser Reihe.
// maxHp 0 = unzerstörbar; dead = zerschossen, bis zur nächsten Welle weg.
interface Cover { x: number; y: number; w: number; h: number; weight: number; row: number; hp: number; maxHp: number; dead: boolean }
interface Boss {
  x: number; y: number; hp: number; maxHp: number; tx: number; moveT: number;
  fanT: number; holdT: number; throws: number; flash: number;
}
interface Slot { cover: number; side: number; taken: boolean }
interface Enemy {
  kind: EnemyKind;
  dead: boolean; // Abschuss schon verbucht (verhindert doppelte Explosionen und Punkte)
  x: number; y: number; hp: number; maxHp: number; hitCd: number; flash: number;
  slot: number; // Stellung an einer Deckung, -1 = keine (Selbstzerstörer)
  state: EnemyState; timer: number; shots: number; cycles: number;
  path: { x: number; y: number }[];
  vault: number; // Zeit, die er schon an der Deckung des Spielers hockt
  spawnT: number; // > 0: steigt noch aus dem Höllentor, weder aktiv noch verwundbar
}
// Nahkampf-Minispiel: energy sinkt, Feuer-Tipps füllen auf; t = durchgehaltene Zeit
interface Clash { enemy: Enemy; energy: number; t: number; intro: number; pulse: number }
interface Bullet { x: number; y: number; vx: number; vy: number; dmg: number; cover: number; r: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface FloatText { x: number; y: number; text: string; life: number; color: string; size: number }

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let H = 640;
let scale = 1;
let offX = 0;
let offY = 0;
let dpr = 1;

const floorY = () => H - T.ctrlH - 14;
const playerY = () => floorY() - 48; // Standlinie der ersten Reihe
const COVER_GAP = 36; // Abstand Standlinie ↔ Deckung davor
let row1Y = 0; // Standlinie der zweiten Reihe, kommt aus layout()
const rowY = (row: number) => (row === 0 ? playerY() : row1Y);
const bodyY = () => player.y + 6; // Körpermitte der Figur, zugleich Trefferpunkt

// cover = Index der Deckung, an der die Figur klebt (-1 = frei); pop = Seite, auf der sie heraussteht (0 = drin)
// row = Reihe (0 hinten, 1 vorne); vert = laufender Reihenwechsel (+1 vor, -1 zurück) zur Deckung toCover
const player = {
  x: T.W / 2, y: 0, hp: T.playerHp, sinceHit: 99, cover: -1, pop: 0, slide: false,
  row: 0, vert: 0, toCover: -1,
};
let rowHold = 0;
let rowAngle = 0;
let clash: Clash | null = null;
// Testseiten: ?boss startet direkt im Bosskampf ohne Wellen
const bossMode = location.search.includes('boss');
let boss: Boss | null = null;
let won = false;
let invuln = 0; // kurzer Schutz nach gewonnenem Nahkampf
let stickHold = 0;
let pendingThrow = false;
let runDir = 1;
let runSpeed = 0;
// face = Blickwinkel (0 = nach oben, ±π/2 = seitlich), phase = Laufzyklus, throwT = Wurfarm
const anim = { face: 0, phase: 0, throwT: 0 };
const disc = {
  x: 0, y: 0, vx: 0, vy: 0,
  state: 'held' as DiscState,
  level: 0,
  pierce: 0,
  combo: 0,
  travelled: 0,
  struck: false, // hat in diesem Flug einen Gegner getroffen
  zone: { x: 0, y: 0, r: 0, row: 0 }, // Fangzone des laufenden Rückflugs (y = Standlinie)
  retSpeed: 0,
  pts: [] as { x: number; y: number }[], // Abprallpunkte für die Kette
  trail: [] as { x: number; y: number }[],
  heat: 0, // 0..1
  overheat: 0, // Restzeit der Zwangspause
};
let covers: Cover[] = [];
let slots: Slot[] = [];
let enemies: Enemy[] = [];
let bullets: Bullet[] = [];
let particles: Particle[] = [];
let texts: FloatText[] = [];

let score = 0;
let streak = 0;
let bestStreak = 0;
let wave = 0;
let spawnQueue: EnemyKind[] = []; // was in diesem Level noch kommt
// Testseite: ?level=7 startet direkt in diesem Level
const startLevel = Math.max(1, Number(new URLSearchParams(location.search).get('level')) || 1);
let waveBreak = 1.5;
let record = 0;
try { record = Number(localStorage.getItem('schrottwall.record')) || 0; } catch { /* privates Fenster */ }

// Dauerhaft gespeichert: Münzen (für spätere Upgrades) und der höchste freigeschaltete Checkpoint
const loadNum = (key: string, def: number) => { try { return Number(localStorage.getItem(key)) || def; } catch { return def; } };
const saveNum = (key: string, v: number) => { try { localStorage.setItem(key, String(v)); } catch { /* privates Fenster */ } };
let coins = loadNum('schrottwall.coins', 0);
let checkpoint = loadNum('schrottwall.checkpoint', 1);
let bricks = 0; // nur für die laufende Runde

type DropKind = 'coin' | 'heart' | 'brick';
interface Drop { kind: DropKind; x: number; y: number; ty: number; vy: number; row: number; life: number }
let drops: Drop[] = [];
// Höllentore, aus denen Gegner steigen (age = Sekunden seit dem Öffnen)
interface Portal { x: number; y: number; age: number }
let portals: Portal[] = [];
// laufende Reparatur: Deckung, Fortschritt, Takt für die Hammerschläge
let repair: { cover: number; t: number; tick: number } | null = null;

// Levelübersicht vor dem Start – außer auf den Testseiten (?level, ?boss, ?clash)
const testStart = /[?&](level|boss|clash|repair)/.test(location.search);
// Testseite: ?repair startet mit vollen Ziegeln, beschädigter und zerschossener Deckung und Beute am Boden
const repairTest = location.search.includes('repair');
let runStart = startLevel;
interface MenuCard { x: number; y: number; w: number; h: number; level: number; open: boolean }
let menuCards: MenuCard[] = [];
let spawnTimer = 1;
let gameOver = false;
let gameOverAt = 0;
let shake = 0;
let freeze = 0;
let catchFlash = 0;
let hurtFlash = 0;
let started = false;

// ---------- Audio ----------
const buzz = (ms: number) => { try { navigator.vibrate?.(ms); } catch { /* nicht überall erlaubt */ } };

// ---------- Helfer ----------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function burst(x: number, y: number, color: string, n: number, speed: number) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(0.3, 1) * speed;
    const life = rand(0.25, 0.6);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: rand(1.5, 3.5) });
  }
}
function floatText(x: number, y: number, text: string, color: string, size = 16) {
  texts.push({ x, y, text, life: 0.9, color, size });
}

// Deckungen von hinten nach vorne: zwei hinten und eine mittig nur für Gegner, zwei in der
// zweiten Reihe für beide Seiten (Gegner oben, Spieler unten), zwei in der ersten Reihe nur für den Spieler.
// Die Spalten 0.22/0.5/0.78 lassen die Laufgassen in T.lanes frei.
function layout() {
  const y0 = T.topY;
  const span = playerY() - y0;
  const hp = (row: number) => (row >= 0 ? { hp: T.coverHp, maxHp: T.coverHp, dead: false } : { hp: 0, maxHp: 0, dead: false });
  const f = (fx: number, fy: number, w: number, weight: number, row = -1): Cover =>
    ({ x: fx * T.W, y: y0 + fy * span, w, h: 16, weight, row, ...hp(row) });
  const old = covers;
  covers = [
    f(0.22, 0.14, 64, 3),
    f(0.78, 0.14, 64, 3),
    f(0.5, 0.34, 72, 2),
    f(0.22, 0.56, 60, 1.5, 1),
    f(0.78, 0.56, 60, 1.5, 1),
    { x: 0.22 * T.W, y: playerY() - COVER_GAP, w: 60, h: 12, weight: 0, row: 0, ...hp(0) },
    { x: 0.78 * T.W, y: playerY() - COVER_GAP, w: 60, h: 12, weight: 0, row: 0, ...hp(0) },
  ];
  // Größenänderung des Fensters soll den Schaden nicht zurücksetzen
  covers.forEach((c, i) => { if (old[i]) { c.hp = old[i].hp; c.dead = old[i].dead; } });
  row1Y = y0 + 0.56 * span + COVER_GAP;
  if (player.vert === 0) player.y = rowY(player.row);
  if (slots.length === 0) {
    covers.forEach((c, i) => {
      if (c.weight > 0) slots.push({ cover: i, side: -1, taken: false }, { cover: i, side: 1, taken: false });
    });
  }
}
function slotPos(slot: number, peek: boolean) {
  const s = slots[slot];
  const c = covers[s.cover];
  const off = peek ? c.w / 2 + T.enemyR + 5 : c.w / 4;
  return {
    x: clamp(c.x + s.side * off, T.enemyR + 2, T.W - T.enemyR - 2),
    y: c.y - c.h / 2 - T.enemyR - 3,
  };
}
// minWeight 3 = nur die hintersten Deckungen (Scharfschützen)
function pickSlot(minWeight = 0) {
  const free = slots.map((s, i) => ({ s, i }))
    .filter((o) => !o.s.taken && !covers[o.s.cover].dead && covers[o.s.cover].weight >= minWeight);
  let total = 0;
  for (const o of free) total += covers[o.s.cover].weight;
  let r = Math.random() * total;
  for (const o of free) {
    r -= covers[o.s.cover].weight;
    if (r <= 0) return o.i;
  }
  return -1;
}
const coverAt = (x: number, y: number, pad: number) =>
  covers.findIndex((c) => !c.dead && Math.abs(x - c.x) < c.w / 2 + pad && Math.abs(y - c.y) < c.h / 2 + pad);
const inCover = (x: number, y: number, pad: number) => coverAt(x, y, pad) >= 0;

function restoreCovers() {
  for (const c of covers) { c.hp = c.maxHp; c.dead = false; }
}
function damageCover(i: number, dmg: number) {
  const c = covers[i];
  if (c.maxHp === 0 || c.dead) return;
  c.hp -= dmg;
  if (c.hp > 0) return;
  c.dead = true;
  burst(c.x, c.y, '#ff9f3d', 30, 260);
  burst(c.x, c.y, '#8fa3c4', 16, 160);
  shake = Math.max(shake, 7);
  sfx('coverBreak');
  buzz(40);
  if (player.cover === i) { player.cover = -1; player.pop = 0; pendingThrow = false; }
  // Gegner, die dahinter hockten, suchen sich eine neue Stellung
  for (const en of enemies) {
    if (en.slot < 0 || slots[en.slot].cover !== i || en.state === 'charge') continue;
    const next = pickSlot();
    if (next < 0) continue;
    slots[en.slot].taken = false;
    slots[next].taken = true;
    en.slot = next;
    en.cycles = 0;
    const to = slotPos(next, false);
    en.path = buildPath(en.x, en.y, to.x, to.y);
    en.state = 'move';
  }
}

// Weg ohne durch Deckungen zu laufen: quer zur Gasse, in der Gasse hoch/runter, quer zum Ziel
function buildPath(fx: number, fy: number, tx: number, ty: number) {
  if (Math.abs(fy - ty) < 2) return [{ x: tx, y: ty }];
  const lane = nearestLane(fx, tx);
  return [{ x: lane, y: fy }, { x: lane, y: ty }, { x: tx, y: ty }];
}
function nearestLane(fx: number, tx: number) {
  return T.lanes.reduce((a, b) => (Math.abs(fx - a) + Math.abs(tx - a) <= Math.abs(fx - b) + Math.abs(tx - b) ? a : b));
}
let exposedT = 0; // wie lange die Figur schon ungedeckt steht
const playerExposed = () => exposedT > T.exposedAfter;
const hideTime = (en: Enemy) =>
  rand(T.kinds[en.kind].hideMin, T.kinds[en.kind].hideMax) * Math.max(0.5, 1 - (wave - 1) * 0.04)
  * (playerExposed() ? T.exposedHideMul : 1);

// Levelaufbau in Zehnerblöcken; jeder Block bringt höchstens einen neuen Gegnertyp:
//   1–3   nur Standardgegner, jedes Level einer mehr
//   4–6   dazu Selbstzerstörer
//   7–9   dazu Panzer (wenige), ein paar Selbstzerstörer bleiben
//   10    Boss
//   11–13 wie 1–3, dazu Scharfschützen;  14–16 dazu Selbstzerstörer;  17–19 dazu Panzer;  20 Boss
//   danach wiederholt sich das Muster, jede Zehnerstufe (tier) mit mehr Gegnern und mehr Leben.
function levelPlan(n: number) {
  const tier = Math.floor((n - 1) / 10);
  const pos = (n - 1) % 10;
  if (pos === 9) return { boss: true, tier, kinds: Array<EnemyKind>(tier * 2).fill('grunt') };
  const block = Math.floor(pos / 3);
  const s = pos % 3;
  const c: Record<EnemyKind, number> = { grunt: 4 + s + tier, bomber: 0, tank: 0, sniper: 0 };
  if (block === 1) c.bomber = 2 + s + tier;
  if (block === 2) {
    c.grunt -= 1;
    c.tank = 1 + (s > 0 ? 1 : 0) + tier;
    c.bomber = s + tier;
  }
  if (tier >= 1) c.sniper = tier + (s > 0 ? 1 : 0);
  const kinds: EnemyKind[] = [];
  for (const k of Object.keys(c) as EnemyKind[]) for (let i = 0; i < c[k]; i++) kinds.push(k);
  // mischen, damit die Typen durcheinander kommen
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return { boss: false, tier, kinds };
}
const NEW_AT: Record<number, string> = { 4: 'Neu: Selbstzerstörer', 7: 'Neu: Panzer', 11: 'Neu: Scharfschützen' };

function startWave(n: number) {
  wave = n;
  const plan = levelPlan(n);
  spawnQueue = plan.kinds;
  spawnTimer = 0.4;
  restoreCovers();
  if (plan.boss) spawnBoss(T.bossHp + plan.tier * T.bossHpPerTier);
  if (repairTest && n === runStart) setupRepairTest();
  if (NEW_AT[n]) floatText(T.W / 2, T.topY + 90, NEW_AT[n], '#ffd23f', 18);
  if (!testStart && (n - 1) % T.checkpointEvery === 0 && n > checkpoint) {
    checkpoint = n;
    saveNum('schrottwall.checkpoint', checkpoint);
    floatText(T.W / 2, T.topY + 120, `Checkpoint ${n} freigeschaltet`, '#5dff8f', 16);
    sfx('unlock');
  }
}
function setupRepairTest() {
  bricks = T.maxBricks - 1; // einer Platz für den Ziegel am Boden
  covers.forEach((c) => {
    if (c.maxHp === 0) return;
    if (c.row === 0 && c.x > T.W / 2) c.dead = true; // rechte Deckung vorne: zerschossen
    else c.hp = c.maxHp * (c.row === 0 ? 0.3 : 0.5); // die anderen angeschlagen
  });
  // Beute direkt neben der Figur zum Aufheben
  const kinds: DropKind[] = ['brick', 'coin', 'heart', 'coin'];
  kinds.forEach((kind, i) => {
    const x = T.W / 2 - 30 + i * 22;
    drops.push({ kind, x, y: rowY(0) + 10, ty: rowY(0) + 10, vy: 0, row: 0, life: 60 });
  });
}
function openPortal(x: number, y: number) {
  portals.push({ x, y, age: 0 });
  sfx('portal');
}
function spawnBoss(hp = T.bossHp) {
  boss = { x: T.W / 2, y: T.topY + 52, hp, maxHp: hp, tx: T.W / 2, moveT: 1, fanT: T.bossFanGap, holdT: 0, throws: 0, flash: 0 };
}
function spawnEnemy(kind: EnemyKind): boolean {
  const k = T.kinds[kind];
  const tier = Math.floor((wave - 1) / 10);
  const hp = k.hp + (kind === 'tank' ? tier * 3 : tier);
  const y = T.topY + T.enemyR + 2;
  const base = { kind, dead: false, hp, maxHp: hp, hitCd: 0, flash: 0, timer: 0, shots: 0, cycles: 0, vault: 0, spawnT: T.portalTime };
  if (kind === 'bomber') {
    // läuft eine Gasse herunter bis hinter die mittlere Deckung, dann direkt auf die Figur zu
    if (enemies.filter((e) => e.kind === 'bomber').length >= T.bomberMax) return false;
    const lane = T.lanes[Math.floor(Math.random() * T.lanes.length)];
    openPortal(lane, y);
    enemies.push({ ...base, x: lane, y, slot: -1, state: 'move', path: [{ x: lane, y: covers[2].y + 34 }] });
    return true;
  }
  const maxEnemies = Math.min(T.maxConcurrent, 2 + Math.floor(wave / 2));
  if (enemies.filter((e) => e.kind !== 'bomber').length >= maxEnemies) return false;
  let slot = kind === 'sniper' ? pickSlot(3) : pickSlot();
  if (slot < 0 && kind === 'sniper') slot = pickSlot();
  if (slot < 0) return false;
  slots[slot].taken = true;
  const to = slotPos(slot, false);
  const c = covers[slots[slot].cover];
  if (wave >= T.sideGateFrom && c.weight < 3 && Math.random() < T.sideGateChance) {
    // Seitentor: kommt auf Höhe seiner Stellung aus der nächsten Wand
    const side = to.x < T.W / 2 ? -1 : 1;
    const gx = side < 0 ? -k.r : T.W + k.r;
    openPortal(clamp(gx, 14, T.W - 14), to.y);
    enemies.push({ ...base, x: clamp(gx, 14, T.W - 14), y: to.y, slot, state: 'move', path: [to] });
    return true;
  }
  // senkrecht von oben in der eigenen Spalte: die Zieldeckung liegt den ganzen Weg zwischen
  // ihm und der Figur, ein gerader Wurf von unten erwischt ihn beim Anmarsch nicht mehr
  openPortal(to.x, y);
  enemies.push({ ...base, x: to.x, y, slot, state: 'move', path: [to] });
  return true;
}
function endGame() {
  gameOver = true;
  gameOverAt = performance.now();
  if (score > record) {
    record = score;
    try { localStorage.setItem('schrottwall.record', String(record)); } catch { /* privates Fenster */ }
  }
}

function reset() {
  enemies = [];
  bullets = [];
  particles = [];
  texts = [];
  decals = [];
  portals = [];
  for (const s of slots) s.taken = false;
  score = 0;
  streak = 0;
  wave = runStart - 1;
  drops = [];
  bricks = 0;
  repair = null;
  spawnQueue = [];
  waveBreak = bossMode ? 0 : repairTest ? 0.2 : 1.5;
  gameOver = false;
  won = false;
  restoreCovers();
  boss = null;
  if (bossMode) spawnBoss();
  player.cover = covers.findIndex((c) => c.row === 0);
  player.row = 0;
  player.vert = 0;
  player.y = rowY(0);
  clash = null;
  invuln = 0;
  rowHold = 0;
  player.pop = 0;
  player.slide = false;
  runSpeed = 0;
  anim.face = 0;
  player.x = covers[player.cover].x;
  player.hp = T.playerHp;
  player.sinceHit = 99;
  stickHold = 0;
  stepTo = null;
  pendingThrow = false;
  disc.state = 'held';
  disc.level = 0;
  disc.trail = [];
  disc.heat = 0;
  disc.overheat = 0;
  exposedT = 0;
}

// ---------- Eingabe ----------
// Links Steuerkreuz, rechts Feuer. Tastatur: Pfeile/WASD + Leertaste.
const touches = new Map<number, 'pad' | 'fire'>();
const keys = new Set<string>();
let padX = 0;
let padY = 0;
let fireFlash = 0;
let moveHold = 0;
let stepTo: number | null = null; // Ziel des Schritts aus der Deckung heraus
let spaceHeld = false;

const padCx = 80;
const padCy = () => H - T.ctrlH / 2;
const fireCx = T.W - 80;

function toLogical(e: PointerEvent) {
  return { x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale };
}
function setPad(p: { x: number; y: number }) {
  const dx = p.x - padCx;
  const dy = p.y - padCy();
  const len = Math.hypot(dx, dy);
  padX = len > 10 && Math.abs(dx) > len * 0.38 ? Math.sign(dx) : 0;
  padY = len > 10 && Math.abs(dy) > len * 0.38 ? Math.sign(dy) : 0;
}
function getInput() {
  const kx = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
  const ky = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0);
  return { x: padX || kx, y: padY || ky };
}
// Wurfrichtung aus dem Kreuz: nichts/hoch = gerade, schräg hoch = steil, seitlich = diagonal, schräg runter = flach
function aimDir() {
  const inp = getInput();
  if (inp.x === 0) return { dx: 0, dy: -1 };
  const deg = inp.y < 0 ? T.aimSteep : inp.y > 0 ? T.aimFlat : T.aimDiag;
  const a = (deg * Math.PI) / 180;
  return { dx: Math.sin(a) * inp.x, dy: -Math.cos(a) };
}
const handY = () => player.y - 18;
const fireHeld = () => spaceHeld || [...touches.values()].includes('fire');
const inZone = () =>
  player.vert === 0 && player.row === disc.zone.row && Math.abs(player.x - disc.zone.x) <= disc.zone.r;

// Sicher = angedockt, nicht herausgetreten und schon hinter der Deckung angekommen
const isCovered = () =>
  player.cover >= 0 && player.vert === 0 && player.pop === 0 && Math.abs(player.x - covers[player.cover].x) < 12;

// Aus der Deckung erst heraustreten (zur Zielseite, sonst zur Feldmitte), dann werfen
function requestThrow() {
  if (disc.state !== 'held' || pendingThrow || player.vert !== 0 || disc.overheat > 0) return;
  if (player.cover >= 0 && player.pop === 0) {
    player.pop = getInput().x || (covers[player.cover].x < T.W / 2 ? 1 : -1);
    player.slide = false;
    pendingThrow = true;
  } else {
    throwDisc();
  }
}

function fire() {
  fireFlash = 1;
  if (gameOver) return;
  if (clash) {
    if (clash.intro <= 0) {
      clash.energy = Math.min(1, clash.energy + T.clashTap);
      clash.pulse = 1;
      sfx('tap', clash.energy);
      buzz(5);
    }
    return;
  }
  cancelRepair(); // Werfen bricht die Reparatur ab
  requestThrow();
}
function startRun(level: number) {
  runStart = level;
  reset();
  started = true;
  sfx('unlock');
}
// Tipp auf eine Karte der Levelübersicht: nur freigeschaltete Checkpoints lassen sich starten
function menuTap(p: { x: number; y: number }) {
  const card = menuCards.find((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
  if (!card) return;
  if (card.open) startRun(card.level);
  else sfx('cancel');
}
// Ton- und Reparatur-Knopf liegen zwischen Kreuz und Feuer; der Abbrechen-Knopf am Reparatur-Fenster
const soundBtn = () => ({ x: T.W / 2, y: padCy() + 44, r: 16 });
const repairBtn = () => ({ x: T.W / 2, y: padCy() - 22, r: 24 });
const repairPopup = () => ({ x: T.W / 2 - 100, y: H - T.ctrlH - 50, w: 200, h: 38 });

// true = Eingabe wurde für Start/Neustart verbraucht
function wake(p?: { x: number; y: number }) {
  unlockAudio();
  if (!started && !testStart) {
    if (p) menuTap(p); else startRun(checkpoint);
    return true;
  }
  // Zum Abstimmen: mit ?clash in der Adresse startet das Spiel direkt im Nahkampf
  if (!started && location.search.includes('clash')) {
    const p = slotPos(0, false);
    const en: Enemy = { kind: 'grunt', dead: false, x: p.x, y: p.y, hp: 1, maxHp: 1, hitCd: 0, flash: 0, slot: 0, state: 'hide', timer: 9, shots: 0, cycles: 0, path: [], vault: 0, spawnT: 0 };
    slots[0].taken = true;
    enemies.push(en);
    startClash(en);
    started = true;
    return true;
  }
  started = true;
  if (!gameOver) return false;
  if (performance.now() - gameOverAt > 700) {
    // zurück zur Levelübersicht; auf den Testseiten direkt neu
    if (testStart) reset(); else { started = false; reset(); }
  }
  return true;
}

canvas.addEventListener('pointerdown', (e) => {
  const p = toLogical(e);
  // Ton-Knopf: alles an → nur Effekte → stumm
  const sb = soundBtn();
  if (Math.hypot(p.x - sb.x, p.y - sb.y) < sb.r + 6) {
    unlockAudio();
    cycleAudioMode();
    return;
  }
  if (started && !gameOver) {
    const rb = repairBtn();
    if (Math.hypot(p.x - rb.x, p.y - rb.y) < rb.r + 4) {
      if (repair) cancelRepair(); else startRepair();
      return;
    }
    const pp = repairPopup();
    if (repair && p.x >= pp.x && p.x <= pp.x + pp.w && p.y >= pp.y && p.y <= pp.y + pp.h) {
      cancelRepair();
      return;
    }
  }
  if (wake(p)) return;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* Capture ist nur Komfort */ }
  if (p.x < T.W / 2) {
    touches.set(e.pointerId, 'pad');
    setPad(p);
  } else {
    touches.set(e.pointerId, 'fire');
    fire();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (touches.get(e.pointerId) === 'pad') setPad(toLogical(e));
});
function release(e: PointerEvent) {
  if (touches.get(e.pointerId) === 'pad') { padX = 0; padY = 0; }
  touches.delete(e.pointerId);
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return; // Tippen in den Reglern steuert nicht das Spiel
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === 'm') { if (!e.repeat) { unlockAudio(); cycleAudioMode(); } return; }
  if (k === 'r') { if (!e.repeat) { if (repair) cancelRepair(); else startRepair(); } return; }
  if (k === ' ' || k === 'Enter') {
    e.preventDefault();
    if (!e.repeat && !wake()) { spaceHeld = true; fire(); }
    return;
  }
  keys.add(k);
});
window.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'Enter') spaceHeld = false;
  keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
});
window.addEventListener('blur', () => { keys.clear(); spaceHeld = false; });

// ---------- Spiel-Logik ----------
function throwDisc() {
  const d = aimDir();
  disc.x = player.x;
  disc.y = handY();
  disc.vx = d.dx * T.levels[disc.level].speed;
  disc.vy = d.dy * T.levels[disc.level].speed;
  disc.pierce = disc.level;
  disc.combo = 0;
  disc.travelled = 0;
  disc.struck = false;
  disc.pts = [];
  disc.state = 'fly';
  disc.trail = [];
  anim.throwT = 0.18;
  disc.heat += T.heatPerThrow;
  if (disc.heat >= 1) {
    // überhitzt: dieser Wurf geht noch, danach muss die Säge abkühlen
    disc.heat = 1;
    disc.overheat = T.overheatTime;
    floatText(player.x, player.y - 44, 'ÜBERHITZT', '#ff8a1f', 15);
    sfx('overheat');
  }
  sfx('throw', disc.level);
  buzz(6);
}

// Rückflug beginnt: Die Fangzone liegt dort, wohin die Disc sichtbar abprallt – nie auf einer zufälligen Seite.
// off = Gegner oder Boss, an dem sie abprallt (sonst prallt sie wie an einer Wand zurück).
// Der Gegnertyp legt nur fest, wie weit die Zone mindestens und höchstens von der Figur entfernt ist.
function beginReturn(kind: ZoneKind, off?: { x: number; y: number }, speed?: number) {
  const z = T.catchZone[kind];
  const L = T.levels[disc.level];
  const r = z.r * L.zone;
  const row = player.vert !== 0 ? player.row + player.vert : player.row;
  const lineY = rowY(row) - 18;
  let side: number;
  let mag: number;
  if (kind === 'boss') {
    // der Boss schleudert sie auf die Seite mit mehr Platz
    side = player.x < T.W / 2 ? 1 : -1;
    mag = rand(z.min, z.max) * L.off;
  } else {
    // Abprallrichtung: am Gegner um dessen Rundung gespiegelt, sonst senkrecht zurück
    let vx = disc.vx;
    let vy = disc.vy;
    if (off) {
      const d = Math.hypot(disc.x - off.x, disc.y - off.y) || 1;
      const nx = (disc.x - off.x) / d;
      const ny = (disc.y - off.y) / d;
      const dot = vx * nx + vy * ny;
      if (dot < 0) { vx -= 2 * dot * nx; vy -= 2 * dot * ny; }
    }
    vy = Math.max(Math.abs(vy), Math.hypot(vx, vy) * 0.5); // immer deutlich nach unten
    // Landepunkt der geraden Bahn auf der Standlinie, an den Seitenwänden zurückgefaltet
    let lx = disc.x + (vx / vy) * Math.max(0, lineY - disc.y);
    const span = T.W - 2 * T.discR;
    lx = ((lx - T.discR) % (2 * span) + 2 * span) % (2 * span);
    lx = T.discR + (lx > span ? 2 * span - lx : lx);
    const natural = lx - player.x;
    side = Math.sign(natural) || Math.sign(vx) || (off ? Math.sign(disc.x - off.x) : 0) || 1;
    // ohne Treffer darf sie auch direkt zurückkommen; ein Treffer verlangt immer ein paar Schritte
    mag = off ? clamp(Math.abs(natural), z.min * L.off, z.max * L.off) : Math.min(Math.abs(natural), z.max * L.off);
  }
  disc.zone = { x: clamp(player.x + side * mag, r + 4, T.W - r - 4), y: rowY(row), r, row };
  disc.retSpeed = speed ?? L.ret;
  disc.state = 'return';
}

// Landung in der Fangzone: steht die Figur drin, fängt sie von selbst. Nach einem Treffer ist das PERFEKT
// und lädt auf; ohne Treffer hält es nur die Stufe. Steht sie nicht drin, bleibt die Disc liegen.
function land() {
  disc.trail = [];
  if (inZone() && !disc.struck) {
    disc.state = 'held';
    catchFlash = 0.4;
    sfx('catch');
    buzz(6);
  } else if (inZone()) {
    disc.state = 'held';
    disc.level = Math.min(disc.level + 1, T.maxLevel);
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    freeze = T.hitStop;
    catchFlash = 1;
    shake = Math.max(shake, 4);
    burst(player.x, handY(), LEVEL_COLORS[disc.level], 18, 240);
    floatText(player.x, player.y - 44, streak > 1 ? `PERFEKT x${streak}` : 'PERFEKT', LEVEL_COLORS[disc.level], 18);
    sfx('perfect', disc.level);
    buzz(20);
  } else {
    disc.state = 'down';
    disc.x = disc.zone.x;
    disc.y = disc.zone.y;
    disc.level = 0;
    streak = 0;
    floatText(disc.x, disc.y - 20, 'DANEBEN', '#ff5a5a', 14);
    burst(disc.x, disc.y, '#ff5a5a', 8, 110);
    sfx('miss');
    buzz(30);
  }
}

const KIND_COLOR: Record<EnemyKind, string> = { grunt: '#e0364a', bomber: '#4a4458', tank: '#7a5ad0', sniper: '#3fb86b' };

// Abschuss verbuchen: Stellung freigeben, Punkte, Blut. Selbstzerstörer explodieren dabei.
function killEnemy(en: Enemy, pts: number) {
  if (en.dead) return;
  en.dead = true;
  en.hp = 0;
  if (en.slot >= 0) slots[en.slot].taken = false;
  score += pts;
  gore(en.x, en.y, en.kind === 'tank' ? 7 : 4);
  gibs(en.x, en.y, KIND_COLOR[en.kind], en.kind === 'tank' ? 16 : 9);
  if (pts > 0) floatText(en.x, en.y - 6, `+${pts}`, '#ffd9a0', 13 + Math.min(disc.combo, 6));
  spawnDrops(en.x, en.y, en.kind);
  if (en.kind === 'bomber') explode(en);
}

// ---------- Beute und Reparatur ----------
function spawnDrops(x: number, y: number, from: EnemyKind | 'boss') {
  // landet auf der nächsten Reihe vor dem Gegner: weit vorne getötet = Vorrücken lohnt sich
  const row = y < row1Y - 10 ? 1 : 0;
  const add = (kind: DropKind) => {
    drops.push({ kind, x: clamp(x + rand(-14, 14), 14, T.W - 14), y, ty: rowY(row) + 10, vy: rand(-160, -60), row, life: T.dropLife });
  };
  const n = from === 'boss' || Math.random() < T.coinChance ? T.coinsPer[from] : 0;
  for (let i = 0; i < n; i++) add('coin');
  if (from === 'boss' || Math.random() < T.heartChance) add('heart');
  if (Math.random() < T.brickChance) add('brick');
}
function collect(d: Drop) {
  if (d.kind === 'brick') {
    if (bricks >= T.maxBricks) return false;
    bricks++;
    floatText(d.x, d.ty - 26, 'Ziegel', '#e3aa5c', 13);
    sfx('brick');
  } else if (d.kind === 'heart') {
    player.hp = Math.min(T.playerHp, player.hp + T.heal);
    floatText(d.x, d.ty - 26, `+${T.heal}`, '#5dff8f', 14);
    sfx('heart');
  } else {
    coins++;
    saveNum('schrottwall.coins', coins);
    sfx('coin');
  }
  burst(d.x, d.ty, d.kind === 'coin' ? '#ffd23f' : d.kind === 'heart' ? BLOOD_HI : '#c98a3c', 6, 90);
  return true;
}
function updateDrops(dt: number) {
  for (const d of drops) {
    // fällt mit Schwerkraft auf die Reihe und hüpft einmal nach
    if (d.y < d.ty || d.vy < 0) {
      d.vy += 900 * dt;
      d.y += d.vy * dt;
      if (d.y >= d.ty) { d.y = d.ty; d.vy = d.vy > 140 ? -d.vy * 0.3 : 0; }
    }
    d.life -= dt;
  }
  drops = drops.filter((d) => {
    if (d.life <= 0) return false;
    const byPlayer = player.vert === 0 && player.row === d.row && d.y >= d.ty - 2 && Math.abs(player.x - d.x) < T.pickupR + 4;
    const byDisc = (disc.state === 'fly' || disc.state === 'return') && Math.hypot(disc.x - d.x, disc.y - d.y) < T.discR + 12;
    return !((byPlayer || byDisc) && collect(d));
  });
}

// Welche Deckung ließe sich gerade reparieren? Die, hinter der die Figur hockt, wenn sie beschädigt ist,
// oder eine zerschossene in der eigenen Reihe direkt neben der Figur.
function repairTarget() {
  if (player.vert !== 0 || player.pop !== 0) return -1;
  if (player.cover >= 0) {
    const c = covers[player.cover];
    return c.maxHp > 0 && c.hp < c.maxHp ? player.cover : -1;
  }
  return covers.findIndex((c) => c.row === player.row && c.dead && c.maxHp > 0 && Math.abs(player.x - c.x) < c.w / 2 + T.snapRange + 10);
}
const canRepair = () => !repair && bricks > 0 && !gameOver && !clash && repairTarget() >= 0;
function startRepair() {
  if (!canRepair()) return;
  repair = { cover: repairTarget(), t: 0, tick: 0 };
  sfx('hammer');
}
function cancelRepair() {
  if (!repair) return;
  repair = null;
  sfx('cancel');
}
// Das Spiel läuft weiter; Bewegen, Werfen oder Reihenwechsel brechen ab
function updateRepair(dt: number) {
  if (!repair) return;
  const i = repair.cover;
  const c = covers[i];
  const away = c.dead ? Math.abs(player.x - c.x) > c.w / 2 + T.snapRange + 10 : player.cover !== i;
  if (getInput().x !== 0 || player.vert !== 0 || player.pop !== 0 || away) { cancelRepair(); return; }
  repair.t += dt;
  repair.tick -= dt;
  if (repair.tick <= 0) {
    repair.tick = 0.28;
    sfx('hammer');
    burst(c.x + rand(-c.w / 3, c.w / 3), c.y, '#c98a3c', 3, 70);
  }
  if (repair.t < T.repairTime) return;
  bricks--;
  if (c.dead) {
    c.dead = false;
    c.hp = c.maxHp * T.brickRepair;
    player.cover = i; // gleich dahinter ducken
  } else {
    c.hp = Math.min(c.maxHp, c.hp + c.maxHp * T.brickRepair);
  }
  floatText(c.x, c.y - 20, 'Repariert', '#e3aa5c', 14);
  sfx('repaired');
  repair = null;
}
// Explosion des Selbstzerstörers: trifft die Figur und alle Gegner im Radius, auch andere Selbstzerstörer
function explode(en: Enemy) {
  burst(en.x, en.y, '#ff8a1f', 34, 340);
  burst(en.x, en.y, '#ffd23f', 18, 220);
  shake = Math.max(shake, 12);
  freeze = T.hitStop;
  sfx('explode');
  buzz(70);
  for (const o of enemies) {
    if (o === en || o.dead || o.spawnT > 0 || Math.hypot(o.x - en.x, o.y - en.y) > T.bomberBlastR) continue;
    o.hp -= T.bomberEnemyDmg;
    o.flash = 1;
    if (o.hp <= 0) killEnemy(o, T.kinds[o.kind].score);
  }
  if (Math.hypot(player.x - en.x, bodyY() - en.y) <= T.bomberBlastR) {
    // geduckt und der Gegner noch vor der Deckung: sie fängt die Explosion ab
    if (isCovered() && en.y < covers[player.cover].y) damageCover(player.cover, T.bomberCoverDmg);
    else hurtPlayer(T.bomberDmg);
  }
}

function hitEnemy(en: Enemy) {
  const dmg = T.levels[disc.level].dmg;
  en.hp -= dmg;
  en.flash = 1;
  en.hitCd = 0.12;
  const color = LEVEL_COLORS[disc.level];
  if (en.hp <= 0) {
    disc.combo++;
    killEnemy(en, T.kinds[en.kind].score * disc.combo);
    shake = Math.max(shake, 4 + Math.min(disc.combo, 5));
    sfx('kill', disc.combo);
    buzz(12);
  } else {
    burst(disc.x, disc.y, color, 4, 140);
    gore(disc.x, disc.y, 1);
    sfx('hit');
    // Treffer drückt den Gegner zurück in die Deckung – Panzer lassen sich davon nicht stören
    if (en.kind !== 'tank' && (en.state === 'out' || en.state === 'aim')) en.state = 'back';
  }
}

function startClash(en: Enemy) {
  clash = { enemy: en, energy: T.clashStart, t: 0, intro: 0.7, pulse: 0 };
  padX = 0;
  padY = 0;
  shake = 10;
  sfx('clashStart');
  buzz(80);
}
function updateClash(dt: number) {
  const c = clash!;
  c.pulse = Math.max(0, c.pulse - dt * 8);
  if (c.intro > 0) { c.intro -= dt; return; }
  c.t += dt;
  const k = c.t / T.clashTime;
  c.energy -= (T.clashDrainStart + (T.clashDrainEnd - T.clashDrainStart) * k) * dt;
  if (c.energy <= 0) {
    clash = null;
    player.hp = 0;
    sfx('lose');
    buzz(200);
    endGame();
  } else if (c.t >= T.clashTime) {
    // Durchgehalten: der Gegner zählt als besiegt, weiter im normalen Spiel
    const en = c.enemy;
    killEnemy(en, 0);
    enemies = enemies.filter((o) => o !== en);
    score += T.clashScore;
    floatText(player.x, player.y - 44, `NAHKAMPF GEWONNEN  +${T.clashScore}`, '#5dff8f', 15);
    bullets = [];
    invuln = 1.5;
    disc.state = 'held';
    disc.trail = [];
    pendingThrow = false;
    clash = null;
    shake = 8;
    sfx('win');
    buzz(40);
  }
}

function hurtPlayer(dmg: number) {
  if (invuln > 0) return;
  player.hp -= dmg;
  player.sinceHit = 0;
  hurtFlash = 1;
  shake = Math.max(shake, 8);
  gore(player.x, bodyY(), 2);
  sfx('hurt');
  buzz(50);
  if (player.hp <= 0) {
    player.hp = 0;
    endGame();
  }
}

function hurtBoss(dmg: number) {
  const b = boss!;
  b.hp -= dmg;
  b.flash = 1;
  shake = Math.max(shake, 6 + dmg * 2);
  freeze = T.hitStop;
  burst(disc.x, disc.y, LEVEL_COLORS[disc.level], 8, 240);
  gore(disc.x, disc.y, 2 + dmg);
  floatText(b.x, b.y + T.bossR + 18, `-${dmg}`, '#ffd9a0', 18);
  sfx('bossHurt');
  buzz(25);
  if (b.hp > 0) return;
  gore(b.x, b.y, 12);
  gibs(b.x, b.y, '#b9a27c', 30);
  spawnDrops(b.x, b.y, 'boss');
  sfx('explode');
  sfx('win');
  score += T.bossScore;
  boss = null;
  bullets = [];
  if (bossMode) { won = true; endGame(); }
}
function updateBoss(dt: number) {
  const b = boss!;
  b.flash = Math.max(0, b.flash - dt * 5);
  if (disc.state === 'boss') return; // steht still, solange er die Disc hält
  b.moveT -= dt;
  if (b.moveT <= 0) { b.tx = rand(60, T.W - 60); b.moveT = rand(1.5, 3); }
  b.x += clamp(b.tx - b.x, -T.bossSpeed * dt, T.bossSpeed * dt);
  b.fanT -= dt;
  if (b.fanT <= 0) {
    b.fanT = T.bossFanGap;
    const base = Math.atan2(bodyY() - b.y, player.x - b.x);
    for (let i = 0; i < T.bossFanCount; i++) {
      const a = base + T.bossFanSpread * ((i / (T.bossFanCount - 1)) * 2 - 1);
      bullets.push({ x: b.x, y: b.y + T.bossR * 0.5, vx: Math.cos(a) * T.bossFanSpeed, vy: Math.sin(a) * T.bossFanSpeed, dmg: T.bossFanDmg, cover: 1, r: 4.5 });
    }
    sfx('bossFan');
  }
}

function bounceOffCover(c: Cover) {
  if (c.dead) return false;
  const hw = c.w / 2;
  const hh = c.h / 2;
  const cx = clamp(disc.x, c.x - hw, c.x + hw);
  const cy = clamp(disc.y, c.y - hh, c.y + hh);
  const dx = disc.x - cx;
  const dy = disc.y - cy;
  const d = Math.hypot(dx, dy);
  if (d >= T.discR) return false;
  let nx = 0;
  let ny = 0;
  if (d < 0.001) {
    // Mittelpunkt steckt in der Deckung: über die kürzere Achse hinausschieben
    if (hw - Math.abs(disc.x - c.x) < hh - Math.abs(disc.y - c.y)) {
      nx = Math.sign(disc.x - c.x) || 1;
      disc.x = c.x + nx * (hw + T.discR);
    } else {
      ny = Math.sign(disc.y - c.y) || 1;
      disc.y = c.y + ny * (hh + T.discR);
    }
  } else {
    nx = dx / d;
    ny = dy / d;
    disc.x = cx + nx * T.discR;
    disc.y = cy + ny * T.discR;
  }
  const dot = disc.vx * nx + disc.vy * ny;
  if (dot < 0) {
    disc.vx -= 2 * dot * nx;
    disc.vy -= 2 * dot * ny;
  }
  return true;
}

let lastHit = { x: 0, y: 0 }; // Ort des zuletzt getroffenen Gegners, für die Abprallrichtung
function hitEnemies() {
  let n = 0;
  for (const en of enemies) {
    if (en.hp <= 0 || en.hitCd > 0 || en.spawnT > 0) continue;
    if (Math.hypot(disc.x - en.x, disc.y - en.y) >= T.kinds[en.kind].r + T.discR) continue;
    lastHit = { x: en.x, y: en.y };
    hitEnemy(en);
    n++;
  }
  return n;
}

// Hinflug: prallt an Wänden und Deckungen ab. Treffer oder Kettenende → zurück.
function stepDisc(dt: number) {
  disc.x += disc.vx * dt;
  disc.y += disc.vy * dt;
  disc.travelled += T.levels[disc.level].speed * dt;

  let bounced = false;
  if (disc.x < T.discR) { disc.x = T.discR; disc.vx = Math.abs(disc.vx); bounced = true; }
  if (disc.x > T.W - T.discR) { disc.x = T.W - T.discR; disc.vx = -Math.abs(disc.vx); bounced = true; }
  if (disc.y < T.topY + T.discR) { disc.y = T.topY + T.discR; disc.vy = Math.abs(disc.vy); bounced = true; }
  for (const c of covers) if (bounceOffCover(c)) bounced = true;
  if (bounced) {
    disc.pts.push({ x: disc.x, y: disc.y });
    burst(disc.x, disc.y, LEVEL_COLORS[disc.level], 4, 90);
    sfx('bounce');
  }

  if (boss && Math.hypot(disc.x - boss.x, disc.y - boss.y) < T.bossR + T.discR) {
    if (disc.level >= 1) {
      const at = { x: boss.x, y: boss.y };
      disc.struck = true;
      hurtBoss(disc.level);
      beginReturn('grunt', at);
    } else {
      // ungeladen: er fängt sie und holt zum Rückwurf aus. Die Fangzone steht schon jetzt fest,
      // damit die Haltezeit zum Loslaufen bleibt. Seinen Rückwurf zu fangen zählt als PERFEKT.
      disc.struck = true;
      beginReturn('boss');
      disc.state = 'boss';
      disc.trail = [];
      boss.holdT = T.bossHold;
      sfx('bossCatch');
    }
    return;
  }

  const hits = hitEnemies();
  disc.pierce -= hits;
  const pastPlayer = disc.vy > 0 && disc.y >= handY(); // abgeprallt und wieder auf Spielerhöhe
  if (hits > 0) disc.struck = true;
  if ((hits > 0 && disc.pierce < 0) || pastPlayer || disc.travelled >= T.chainLen + disc.level * T.chainPerLevel) {
    if (hits > 0) beginReturn('grunt', lastHit); else beginReturn(disc.struck ? 'grunt' : 'none');
  }
}

// Rückweg: gerade zur Fangzone, durch Deckungen hindurch, trifft Gegner auf dem Weg.
// Steht die Figur schon in der Zone, fliegt die Disc ihr direkt in die Hand statt am Ende zu springen.
function stepReturn(dt: number) {
  const dx = (inZone() ? player.x : disc.zone.x) - disc.x;
  const dy = disc.zone.y - 18 - disc.y;
  const d = Math.hypot(dx, dy);
  const step = disc.retSpeed * dt;
  if (d <= step) { land(); return; }
  disc.x += (dx / d) * step;
  disc.y += (dy / d) * step;
  hitEnemies();
}

function walkTo(en: Enemy, tx: number, ty: number, speed: number, dt: number) {
  const dx = tx - en.x;
  const dy = ty - en.y;
  const d = Math.hypot(dx, dy);
  const step = speed * dt;
  if (d <= step) { en.x = tx; en.y = ty; return true; }
  en.x += (dx / d) * step;
  en.y += (dy / d) * step;
  return false;
}

// Gegner: zur Deckung laufen → verstecken → seitlich heraustreten → zielen → schießen → zurück.
function updateEnemy(en: Enemy, dt: number) {
  if (en.spawnT > 0) { en.spawnT -= dt; return; }
  en.hitCd -= dt;
  en.flash = Math.max(0, en.flash - dt * 6);
  const k = T.kinds[en.kind];
  if (en.kind === 'bomber') {
    // erst die Gasse herunter, dann geradewegs auf die Figur zu, zum Schluss schneller
    if (en.path.length > 0) {
      if (walkTo(en, en.path[0].x, en.path[0].y, k.walk, dt)) en.path.shift();
    } else {
      walkTo(en, player.x, bodyY(), k.walk * 1.25, dt);
    }
    return;
  }
  const hide = slotPos(en.slot, false);
  const peek = slotPos(en.slot, true);
  // Hockt der Spieler an derselben Deckung, springt ein Standardgegner nach kurzer Zeit herüber
  if (en.kind === 'grunt' && en.state !== 'move' && en.state !== 'charge') {
    if (player.vert === 0 && player.cover === slots[en.slot].cover) {
      en.vault += dt;
      if (en.vault > T.vaultDelay) {
        en.state = 'charge';
        en.timer = T.chargeTime;
        en.vault = 0;
        sfx('alert');
      }
    } else {
      en.vault = 0;
    }
  }
  switch (en.state) {
    case 'charge':
      en.timer -= dt;
      walkTo(en, player.x, bodyY(), T.chargeSpeed, dt);
      if (en.timer <= 0) {
        en.path = buildPath(en.x, en.y, hide.x, hide.y);
        en.state = 'move';
      }
      break;
    case 'move':
      if (walkTo(en, en.path[0].x, en.path[0].y, k.walk, dt)) {
        en.path.shift();
        if (en.path.length === 0) { en.state = 'hide'; en.timer = hideTime(en); }
      }
      break;
    case 'hide':
      en.timer -= dt;
      if (en.timer <= 0) {
        const exposed = enemies.filter((o) => o.state === 'out' || o.state === 'aim').length;
        const limit = T.maxAimers + (playerExposed() ? T.exposedExtraAimers : 0);
        if (exposed < limit) en.state = 'out'; else en.timer = 0.3;
      }
      break;
    case 'out':
      if (walkTo(en, peek.x, peek.y, k.peek, dt)) { en.state = 'aim'; en.timer = k.aim * (playerExposed() ? T.exposedAimMul : 1); en.shots = Math.floor(rand(k.burstMin, k.burstMax + 1)); }
      break;
    case 'aim':
      en.timer -= dt;
      if (en.timer <= 0) {
        const a = Math.atan2(bodyY() - en.y, player.x - en.x) + rand(-k.spread, k.spread);
        bullets.push({ x: en.x, y: en.y, vx: Math.cos(a) * k.shotSpeed, vy: Math.sin(a) * k.shotSpeed, dmg: k.shotDmg, cover: k.coverDmg, r: k.shotR });
        if (en.kind === 'tank') { sfx('shotTank'); shake = Math.max(shake, 3); }
        else if (en.kind === 'sniper') sfx('shotSniper');
        else sfx('shot');
        en.shots--;
        if (en.shots > 0) en.timer = k.gap; else en.state = 'back';
      }
      break;
    case 'back':
      if (walkTo(en, hide.x, hide.y, k.peek, dt)) {
        en.cycles++;
        // Stellungswechsel machen nur Standardgegner; Panzer und Scharfschützen bleiben, wo sie sind
        const next = en.kind === 'grunt' && en.cycles >= 2 && Math.random() < 0.5 ? pickSlot() : -1;
        if (next >= 0) {
          // Stellungswechsel: offen quer übers Feld
          slots[en.slot].taken = false;
          slots[next].taken = true;
          en.slot = next;
          en.cycles = 0;
          const to = slotPos(next, false);
          en.path = buildPath(en.x, en.y, to.x, to.y);
          en.state = 'move';
        } else {
          en.state = 'hide';
          en.timer = hideTime(en);
        }
      }
      break;
  }
}

// Reihenwechsel: Kreuz nur hoch/runter kurz halten → Sprint zur nächsten Deckung der anderen Reihe
function tryRowChange(inp: { x: number; y: number }, dt: number) {
  const want = inp.x !== 0 ? 0 : inp.y < 0 && player.row === 0 ? 1 : inp.y > 0 && player.row === 1 ? -1 : 0;
  if (want === 0 || player.pop !== 0 || pendingThrow) { rowHold = 0; return; }
  rowHold += dt;
  if (rowHold < T.rowHold) return;
  rowHold = 0;
  let best = -1;
  covers.forEach((c, i) => {
    if (c.row === player.row + want && !c.dead && (best < 0 || Math.abs(c.x - player.x) < Math.abs(covers[best].x - player.x))) best = i;
  });
  player.vert = want;
  player.toCover = best;
  stepTo = null;
  player.cover = -1;
  player.slide = false;
  stickHold = 0;
  sfx('sprint');
}
function stepRowChange(dt: number) {
  // ohne heile Deckung in der Zielreihe geht es gerade hinüber ins Offene
  const c = player.toCover >= 0 ? covers[player.toCover] : null;
  const tx = c && !c.dead ? c.x : player.x;
  const ty = rowY(player.row + player.vert);
  const dx = tx - player.x;
  const dy = ty - player.y;
  const d = Math.hypot(dx, dy);
  const step = T.sprintSpeed * dt;
  if (d <= step) {
    player.x = tx;
    player.y = ty;
    player.row += player.vert;
    player.vert = 0;
    player.cover = c && !c.dead ? player.toCover : -1;
    player.slide = false;
    shake = Math.max(shake, 2.5);
    sfx('thud');
    buzz(12);
    return;
  }
  rowAngle = Math.atan2(dx, -dy);
  player.x += (dx / d) * step;
  player.y += (dy / d) * step;
  anim.phase += dt * 18;
  // die letzten Meter rutschen
  player.slide = d < T.rowSlide;
  if (player.slide) {
    particles.push({ x: player.x + rand(-6, 6), y: bodyY() - (dy / d) * 10, vx: rand(-25, 25), vy: -(dy / d) * rand(20, 70), life: 0.35, max: 0.35, color: '#8fa3c4', size: rand(2, 4) });
  }
}

function update(dt: number) {
  // Spieler
  const inp = getInput();
  if (player.vert !== 0) stepRowChange(dt); else tryRowChange(inp, dt);
  if (player.cover >= 0) {
    // Angedockt: schon ein kurzer Tipp aufs Kreuz tritt aus der Deckung heraus, bis knapp außerhalb
    // der Andock-Zone. Erst wer weiter hält, läuft los. Herausgetreten zum Werfen zielt das Kreuz nur.
    const out = disc.state !== 'held';
    if (inp.x !== 0 && !pendingThrow && (out || player.pop === 0)) {
      stickHold += dt;
      if (stickHold > (out ? T.unstickCatch : T.unstick)) {
        const c = covers[player.cover];
        stepTo = clamp(c.x + inp.x * (c.w / 2 + T.snapRange + 8), 16, T.W - 16);
        player.cover = -1;
        player.slide = false;
        stickHold = 0;
        moveHold = 0;
        runSpeed = 0;
      }
    } else {
      stickHold = 0;
    }
  }
  if (player.cover >= 0) {
    const c = covers[player.cover];
    // Draußen bleiben, solange die Disc unterwegs ist oder Feuer gehalten wird
    // … außer der Boss hat sie: dann darf man sich wieder ducken
    const canDuck = disc.state === 'held' || disc.state === 'boss';
    if (player.pop !== 0 && !pendingThrow && canDuck && !fireHeld()) player.pop = 0;
    const tx = player.pop !== 0 ? c.x + player.pop * (c.w / 2 + T.popOffset) : c.x;
    // Rutschen bremst zur Deckung hin ab, Heraustreten ist gleichmäßig schnell
    const step = (player.slide ? clamp(Math.abs(tx - player.x) * 8, 160, 640) : T.popSpeed) * dt;
    player.x = Math.abs(tx - player.x) <= step ? tx : player.x + Math.sign(tx - player.x) * step;
    if (player.slide) {
      particles.push({ x: player.x - runDir * 10, y: bodyY() + rand(-4, 8), vx: -runDir * rand(20, 70), vy: rand(-20, 20), life: 0.35, max: 0.35, color: '#8fa3c4', size: rand(2, 4) });
      if (player.x === tx) {
        player.slide = false;
        shake = Math.max(shake, 2.5);
        sfx('thud');
        buzz(12);
      }
    }
    if (pendingThrow && player.x === tx) {
      pendingThrow = false;
      if (disc.state === 'held') throwDisc();
    }
  } else if (player.vert === 0) {
    pendingThrow = false;
    player.pop = 0;
    if (stepTo !== null) {
      // Schritt aus der Deckung zu Ende gehen, auch wenn das Kreuz schon losgelassen ist
      const step = T.popSpeed * dt;
      runDir = Math.sign(stepTo - player.x) || runDir;
      if (Math.abs(stepTo - player.x) <= step) { player.x = stepTo; stepTo = null; }
      else player.x += runDir * step;
      anim.phase += dt * 15;
    } else if (inp.x !== 0) {
      moveHold += dt;
      const sp = T.playerSpeedMin + (T.playerSpeed - T.playerSpeedMin) * Math.min(1, moveHold / T.playerRamp);
      player.x = clamp(player.x + inp.x * sp * dt, 16, T.W - 16);
      runDir = inp.x;
      runSpeed = sp;
      const before = Math.floor(anim.phase / Math.PI);
      anim.phase += dt * 15;
      if (Math.floor(anim.phase / Math.PI) !== before) {
        particles.push({ x: player.x - runDir * 6, y: bodyY() + 8, vx: -runDir * 30, vy: rand(-10, 10), life: 0.25, max: 0.25, color: '#5b6b85', size: 2.5 });
      }
    } else {
      // Magnet: losgelassen in Reichweite einer eigenen Deckung → andocken.
      // Aus vollem Lauf reicht die größere Rutsch-Reichweite zur Deckung in Laufrichtung –
      // aber nur nach einem echten Anlauf, nicht schon nach einem längeren Tipp.
      const fast = runSpeed >= T.playerSpeed * 0.9 && moveHold >= T.slideMinRun;
      moveHold = 0;
      const r = player.row;
      player.cover = covers.findIndex((c) => c.row === r && !c.dead && Math.abs(player.x - c.x) < c.w / 2 + T.snapRange);
      if (player.cover < 0 && fast) {
        player.cover = covers.findIndex((c) =>
          c.row === r && !c.dead && (c.x - player.x) * runDir > 0 && Math.abs(player.x - c.x) < c.w / 2 + T.slideRange);
      }
      if (player.cover >= 0 && fast) {
        player.slide = true;
        runDir = Math.sign(covers[player.cover].x - player.x) || runDir;
        sfx('slide');
      }
      runSpeed = 0;
    }
  }
  const running = player.cover < 0 && (inp.x !== 0 || stepTo !== null);
  const faceTo = player.vert !== 0 ? rowAngle : player.slide || running ? runDir * Math.PI / 2 : 0;
  anim.face += (faceTo - anim.face) * Math.min(1, dt * 16);
  anim.throwT = Math.max(0, anim.throwT - dt);
  player.sinceHit += dt;
  // im Freien (nicht geduckt) zählt die Zeit hoch, in Deckung sofort zurück
  exposedT = isCovered() || player.vert !== 0 ? 0 : exposedT + dt;
  // Hitze: in der Hand schneller abkühlen; Zwangspause läuft ab, dabei dampft die Säge
  if (disc.overheat > 0) {
    disc.overheat -= dt;
    disc.heat = Math.max(0, disc.overheat / T.overheatTime);
    if (Math.random() < 0.5) {
      const sx = disc.state === 'held' ? player.x : disc.x;
      const sy = disc.state === 'held' ? handY() : disc.y;
      particles.push({ x: sx + rand(-5, 5), y: sy, vx: rand(-15, 15), vy: rand(-70, -35), life: 0.6, max: 0.6, color: '#d9d4e2', size: rand(3, 6) });
    }
    if (disc.overheat <= 0) { disc.overheat = 0; disc.heat = 0; sfx('cooled'); }
  } else {
    disc.heat = Math.max(0, disc.heat - (disc.state === 'held' ? T.heatCoolHeld : T.heatCoolFly) * dt);
  }
  if (player.sinceHit > (isCovered() ? T.regenDelayCover : T.regenDelay)) {
    player.hp = Math.min(T.playerHp, player.hp + T.regenRate * dt);
  }

  // Gegner
  if (waveBreak > 0) {
    waveBreak -= dt;
    if (waveBreak <= 0) startWave(wave + 1);
  } else {
    spawnTimer -= dt;
    if (spawnQueue.length > 0 && spawnTimer <= 0) {
      // den ersten Typ aus der Warteschlange nehmen, für den gerade Platz ist
      const i = spawnQueue.findIndex((kind) => spawnEnemy(kind));
      if (i >= 0) {
        spawnQueue.splice(i, 1);
        spawnTimer = T.spawnGap;
      }
    }
  }
  for (const en of enemies) updateEnemy(en, dt);
  if (boss) updateBoss(dt);
  invuln = Math.max(0, invuln - dt);
  // Berührung: Selbstzerstörer explodieren, alle anderen gehen in den Nahkampf
  for (const en of enemies) {
    if (en.dead || en.spawnT > 0 || Math.hypot(en.x - player.x, en.y - bodyY()) >= T.kinds[en.kind].r + 10) continue;
    if (en.kind === 'bomber') { killEnemy(en, 0); continue; }
    if (invuln <= 0) { startClash(en); return; }
  }
  enemies = enemies.filter((en) => en.hp > 0 && !en.dead);
  if (gameOver) return;
  if (waveBreak <= 0 && wave > 0 && spawnQueue.length === 0 && enemies.length === 0 && !boss && !bossMode) {
    const bonus = 50 * wave;
    score += bonus;
    waveBreak = T.waveBreak;
    player.hp = Math.min(T.playerHp, player.hp + T.waveHeal);
    floatText(T.W / 2, playerY() - 70, `Level ${wave} geschafft  +${bonus}`, '#5dff8f', 16);
    sfx('levelDone');
  }

  // Kugeln
  const hitY = bodyY();
  bullets = bullets.filter((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const ci = coverAt(b.x, b.y, 2);
    if (ci >= 0) {
      burst(b.x, b.y, '#8fa3c4', 4 + b.cover, 80 + b.cover * 15);
      sfx('coverHit');
      damageCover(ci, b.cover);
      return false;
    }
    // Die fliegende Disc schneidet Kugeln weg
    if (disc.state !== 'held' && Math.hypot(b.x - disc.x, b.y - disc.y) < T.discR + 6) {
      burst(b.x, b.y, '#ffb04a', 6, 120);
      sfx('cut');
      return false;
    }
    if (Math.hypot(b.x - player.x, b.y - hitY) < 12) {
      if (isCovered()) {
        // Deckung fängt auch Schüsse ab, die schräg darunter durchkämen
        burst(b.x, covers[player.cover].y, '#ff9f3d', 5, 110);
        sfx('coverHit');
        damageCover(player.cover, b.cover);
      } else {
        hurtPlayer(b.dmg);
      }
      return false;
    }
    return b.x > 0 && b.x < T.W && b.y > T.topY && b.y < floorY() + 10;
  });

  // Disc
  if (disc.state === 'boss') {
    if (!boss) {
      beginReturn('none');
    } else {
      disc.x = boss.x;
      disc.y = boss.y + T.bossR;
      boss.holdT -= dt;
      if (boss.holdT <= 0) {
        // er wirft sie weit weg von der Figur, jedes Mal schneller
        disc.retSpeed = Math.min(T.bossThrowMax, T.bossThrowSpeed + T.bossThrowGain * boss.throws++);
        disc.state = 'return';
        sfx('bossThrow');
      }
    }
  } else if (disc.state === 'down') {
    // liegt am Boden: hinlaufen hebt sie auf, ohne Aufladung
    if (player.vert === 0 && player.row === disc.zone.row && Math.abs(player.x - disc.x) < T.pickupR) {
      disc.state = 'held';
      catchFlash = 0.3;
      sfx('pickup');
    }
  } else if (disc.state !== 'held') {
    disc.trail.push({ x: disc.x, y: disc.y });
    if (disc.trail.length > 10) disc.trail.shift();
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      if (disc.state === 'fly') stepDisc(dt / steps);
      else if (disc.state === 'return') stepReturn(dt / steps);
    }
  }
  if (disc.state === 'held') {
    disc.x = player.x;
    disc.y = handY();
    if (fireHeld() && !repair) requestThrow();
  }
  updateDrops(dt);
  updateRepair(dt);
}

function updateFx(dt: number) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  for (const t of texts) { t.y -= 28 * dt; t.life -= dt; }
  texts = texts.filter((t) => t.life > 0);
  shake = Math.max(0, shake - dt * 30);
  for (const p of portals) {
    p.age += dt;
    // Glut steigt aus dem offenen Tor
    if (p.age < T.portalTime && Math.random() < 0.6) {
      particles.push({ x: p.x + rand(-16, 16), y: p.y + rand(-4, 6), vx: rand(-20, 20), vy: rand(-90, -40), life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ff5a1f' : '#ffd23f', size: rand(2, 4) });
    }
  }
  portals = portals.filter((p) => p.age < T.portalTime + T.portalClose);
  catchFlash = Math.max(0, catchFlash - dt * 4);
  hurtFlash = Math.max(0, hurtFlash - dt * 3);
  fireFlash = Math.max(0, fireFlash - dt * 6);
}

// ---------- Zeichnen ----------
// Look: Comic (dicke Tuschekonturen, satte Farben) mit Gore (Blut spritzt und bleibt am Boden liegen).
const INK = '#1a0f1c';
const BLOOD = '#b3122a';
const BLOOD_HI = '#e2203a';
const BONE = '#f3e6c8';

interface Decal { x: number; y: number; r: number; a: number }
let decals: Decal[] = [];

// Blut: Spritzer als Partikel plus bleibende Flecken. amount ≈ 1 Treffer, 4 Abschuss, 10 Boss.
function gore(x: number, y: number, amount: number) {
  for (let i = 0; i < amount * 5; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(40, 130 + amount * 35);
    const life = rand(0.3, 0.7);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color: Math.random() < 0.6 ? BLOOD_HI : BLOOD, size: rand(2.5, 4 + amount * 0.5) });
  }
  for (let i = 0; i < amount; i++) {
    const spread = 6 + amount * 4;
    decals.push({ x: x + rand(-spread, spread), y: y + rand(-spread, spread), r: rand(3, 6) + amount * 0.6, a: rand(0, Math.PI * 2) });
  }
  if (decals.length > 90) decals = decals.slice(decals.length - 90);
}
// Brocken beim Abschuss: Fleisch, Knochen und Haut in der Farbe des Gegners
function gibs(x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(120, 320);
    const life = rand(0.5, 0.9);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color: [BLOOD_HI, BONE, color][i % 3], size: rand(5, 8) });
  }
}

function inkStroke(width = 2.5) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.stroke();
}
function comicText(text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center') {
  ctx.font = `900 ${size}px system-ui, "Arial Black", sans-serif`;
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, size * 0.24);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function limb(x1: number, y1: number, x2: number, y2: number, w: number, color: string) {
  ctx.lineCap = 'round';
  for (const [c, lw] of [[INK, w + 3], [color, w]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function hpBar(x: number, y: number, w: number, h: number, frac: number, color: string) {
  ctx.fillStyle = INK;
  ctx.fillRect(x - w / 2 - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#4a3b52';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), h);
}

// Dämon von oben: runder Körper, Hörner, zornige Augen, Reißzähne. Auch der Boss ist so einer, nur größer.
function drawDemon(x: number, y: number, r: number, body: string, eyes: string, hornScale = 1) {
  ctx.fillStyle = BONE;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.45, y - r * 0.7);
    ctx.lineTo(x + s * r * (0.95 + 0.25 * hornScale), y - r * (1.0 + 0.45 * hornScale));
    ctx.lineTo(x + s * r * 0.92, y - r * 0.25);
    ctx.closePath();
    ctx.fill();
    inkStroke(2);
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(r > 20 ? 3 : 2.5);
  ctx.fillStyle = 'rgba(26,15,28,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.42, r * 0.72, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const s of [-1, 1]) {
    ctx.fillStyle = eyes;
    ctx.beginPath();
    ctx.ellipse(x + s * r * 0.38, y - r * 0.12, r * 0.24, r * 0.17, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    inkStroke(1.5);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x + s * r * 0.34, y - r * 0.1, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Brauen
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.72, y - r * 0.48);
    ctx.lineTo(x + s * r * 0.12, y - r * 0.26);
    inkStroke(r > 20 ? 3.5 : 2.5);
    // Reißzahn
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.12, y + r * 0.38);
    ctx.lineTo(x + s * r * 0.36, y + r * 0.38);
    ctx.lineTo(x + s * r * 0.24, y + r * 0.66);
    ctx.closePath();
    ctx.fill();
    inkStroke(1.2);
  }
  ctx.beginPath();
  ctx.moveTo(x - r * 0.48, y + r * 0.38);
  ctx.lineTo(x + r * 0.48, y + r * 0.38);
  inkStroke(2);
}

// Sägeblatt statt Scheibe: Stahl mit Zähnen, die Nabe zeigt die Stufe
function drawSaw(x: number, y: number, r: number, spin: number) {
  const teeth = 9;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = spin + (Math.PI / teeth) * i;
    const rr = i % 2 === 0 ? r + 3 : r - 1.5;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#dfe6ee';
  ctx.fill();
  inkStroke(2);
  ctx.fillStyle = LEVEL_COLORS[disc.level];
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(1.5);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // Hitze nur als Glühen: färbt das Blatt von gelb über orange nach rot, ab halber Hitze mit Hof;
  // überhitzt blinkt es
  const h = disc.heat;
  if (h > 0.02) {
    const hot = disc.overheat > 0 && Math.floor(performance.now() / 110) % 2 === 0;
    const col = h > 0.7 ? '#ff3a1f' : h > 0.4 ? '#ff8a1f' : '#ffd23f';
    if (h > 0.5 || hot) {
      ctx.globalAlpha = hot ? 0.45 : (h - 0.5) * 0.7;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r + 6 + h * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = hot ? 0.85 : h * 0.7;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Figur von oben, vorne = lokal -y. Zustände: stehen, laufen (Beine/Arme pendeln),
// rutschen (gestreckt, Füße voraus), geduckt hinter Deckung, Wurfarm.
function drawPlayer() {
  const safe = isCovered();
  const running = player.vert !== 0 || (player.cover < 0 && (getInput().x !== 0 || stepTo !== null));
  const s = running ? Math.sin(anim.phase) : 0;
  const jacket = hurtFlash > 0.5 ? BLOOD_HI : '#2fd0c0';
  ctx.save();
  ctx.translate(player.x, bodyY() + (safe ? -3 : 0));
  ctx.rotate(anim.face);
  if (player.slide) ctx.scale(0.85, 1.3);
  else if (safe) ctx.scale(0.92, 0.8);

  // Beine
  if (player.slide) {
    limb(-4, 0, -5, -17, 5, '#3b4a78');
    limb(4, 0, 5, -13, 5, '#3b4a78');
  } else {
    limb(-5, 2, -5, 4 - s * 9, 5, '#3b4a78');
    limb(5, 2, 5, 4 + s * 9, 5, '#3b4a78');
  }
  // Arme
  if (player.slide) {
    limb(-10, 0, -13, 9, 4, jacket);
    limb(10, 0, 13, 7, 4, jacket);
  } else if (running) {
    limb(-10, 0, -11, s * 8, 4, jacket);
    limb(10, 0, 11, -s * 8, 4, jacket);
  } else {
    limb(-10, 0, -5, -11, 4, jacket);
    if (anim.throwT > 0) limb(10, 0, 8, -17, 4, jacket); else limb(10, 0, 5, -11, 4, jacket);
  }
  // Rucksack und Rumpf
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.rect(-6, 3, 12, 7);
  ctx.fill();
  inkStroke(2);
  ctx.fillStyle = jacket;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(2.5);
  // Helm mit Visier nach vorne
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(0, -1, 6, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(2);
  ctx.fillStyle = INK;
  ctx.fillRect(-4, -6.5, 8, 3);
  ctx.restore();
}

// Vorschau der Flugbahn: prallt an Wänden ab, endet an der ersten Deckung
function drawAim() {
  if (disc.state !== 'held' || gameOver || !started) return;
  const aim = aimDir();
  let x = disc.x;
  let y = disc.y;
  let dx = aim.dx;
  let dy = aim.dy;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = (T.chainLen + disc.level * T.chainPerLevel) / 4;
  for (let i = 0; i < steps; i++) {
    x += dx * 4;
    y += dy * 4;
    if (x < T.discR || x > T.W - T.discR) { dx = -dx; x = clamp(x, T.discR, T.W - T.discR); ctx.lineTo(x, y); }
    if (y < T.topY + T.discR) { dy = -dy; y = T.topY + T.discR; ctx.lineTo(x, y); }
    if (inCover(x, y, T.discR) || y > disc.y) break;
  }
  ctx.lineTo(x, y);
  ctx.setLineDash([5, 8]);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = LEVEL_COLORS[disc.level];
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawControls() {
  const top = H - T.ctrlH;
  ctx.fillStyle = '#241628';
  ctx.fillRect(0, top, T.W, T.ctrlH);
  ctx.fillStyle = INK;
  ctx.fillRect(0, top, T.W, 4);
  ctx.fillStyle = '#6d5a78';
  ctx.fillRect(0, top + 4, T.W, 2);

  // Steuerkreuz
  const cy = padCy();
  const arm = 56;
  const w = 38;
  const inp = getInput();
  ctx.beginPath();
  ctx.moveTo(padCx - w / 2, cy - arm);
  ctx.lineTo(padCx + w / 2, cy - arm);
  ctx.lineTo(padCx + w / 2, cy - w / 2);
  ctx.lineTo(padCx + arm, cy - w / 2);
  ctx.lineTo(padCx + arm, cy + w / 2);
  ctx.lineTo(padCx + w / 2, cy + w / 2);
  ctx.lineTo(padCx + w / 2, cy + arm);
  ctx.lineTo(padCx - w / 2, cy + arm);
  ctx.lineTo(padCx - w / 2, cy + w / 2);
  ctx.lineTo(padCx - arm, cy + w / 2);
  ctx.lineTo(padCx - arm, cy - w / 2);
  ctx.lineTo(padCx - w / 2, cy - w / 2);
  ctx.closePath();
  ctx.fillStyle = '#5b4a66';
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  if (inp.x < 0) ctx.fillRect(padCx - arm, cy - w / 2, arm - w / 2, w);
  if (inp.x > 0) ctx.fillRect(padCx + w / 2, cy - w / 2, arm - w / 2, w);
  if (inp.y < 0) ctx.fillRect(padCx - w / 2, cy - arm, w, arm - w / 2);
  if (inp.y > 0) ctx.fillRect(padCx - w / 2, cy + w / 2, w, arm - w / 2);
  inkStroke(3);
  ctx.fillStyle = INK;
  for (const [ax, ay] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const tx = padCx + ax * (arm - 14);
    const ty = cy + ay * (arm - 14);
    ctx.beginPath();
    ctx.moveTo(tx + ax * 7, ty + ay * 7);
    ctx.lineTo(tx - ax * 4 + ay * 7, ty - ay * 4 + ax * 7);
    ctx.lineTo(tx - ax * 4 - ay * 7, ty - ay * 4 - ax * 7);
    ctx.closePath();
    ctx.fill();
  }

  // Feuer
  const ready = !gameOver && (clash !== null || disc.state === 'held');
  const r = 48 - fireFlash * 4;
  ctx.beginPath();
  ctx.arc(fireCx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = clash ? '#ffd23f' : ready ? BLOOD_HI : '#6b4a58';
  ctx.fill();
  inkStroke(3.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(fireCx, cy, r - 8, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  comicText('FEUER', fireCx, cy + 6, 16, ready ? '#ffffff' : '#b9a6c2');

  // Reparatur-Knopf: Ziegel mit Anzahl; leuchtet, wenn hier gerade etwas zu reparieren ist
  if (started && !gameOver) {
    const rb = repairBtn();
    const can = canRepair();
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, rb.r, 0, Math.PI * 2);
    ctx.fillStyle = repair ? '#ffd23f' : can ? '#c98a3c' : '#4a3b52';
    ctx.fill();
    inkStroke(can || repair ? 3 : 2);
    ctx.globalAlpha = can || repair || bricks > 0 ? 1 : 0.45;
    drawBrickIcon(rb.x - 1, rb.y - 4, 22, 11);
    comicText(`${bricks}`, rb.x, rb.y + 17, 11, '#ffffff');
    ctx.globalAlpha = 1;
  }

  // Ton-Knopf: Lautsprecher mit Wellen (alles), ohne Wellen (nur Effekte), durchgestrichen (stumm)
  const { x: mx, y: my, r: mr } = soundBtn();
  const am = audioMode();
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fillStyle = '#5b4a66';
  ctx.fill();
  inkStroke(2.5);
  ctx.fillStyle = am === 2 ? '#8a7896' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(mx - 8, my - 3);
  ctx.lineTo(mx - 4, my - 3);
  ctx.lineTo(mx + 1, my - 7);
  ctx.lineTo(mx + 1, my + 7);
  ctx.lineTo(mx - 4, my + 3);
  ctx.lineTo(mx - 8, my + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (am === 0) {
    ctx.arc(mx + 2, my, 4.5, -0.9, 0.9);
    ctx.moveTo(mx + 2 + Math.cos(-0.9) * 8, my + Math.sin(-0.9) * 8);
    ctx.arc(mx + 2, my, 8, -0.9, 0.9);
  } else if (am === 2) {
    ctx.strokeStyle = BLOOD_HI;
    ctx.lineWidth = 3;
    ctx.moveTo(mx - 8, my + 8);
    ctx.lineTo(mx + 8, my - 8);
  }
  ctx.stroke();
}

// ---------- Beute, Reparatur, Levelübersicht ----------
function drawCoinIcon(x: number, y: number, r: number) {
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(2);
  ctx.strokeStyle = '#c99a12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}
function drawHeartIcon(x: number, y: number, s: number) {
  ctx.fillStyle = BLOOD_HI;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.9, y - s * 1.1, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.9, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
  inkStroke(2);
}
function drawBrickIcon(x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = '#c96a3c';
  ctx.fill();
  inkStroke(2);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.moveTo(x - w / 6, y - h / 2);
  ctx.lineTo(x - w / 6, y);
  ctx.moveTo(x + w / 4, y);
  ctx.lineTo(x + w / 4, y + h / 2);
  inkStroke(1.2);
}
function drawDrops() {
  for (const d of drops) {
    if (d.life < 2 && Math.floor(d.life * 8) % 2 === 0) continue; // blinkt kurz vor dem Verschwinden
    const bob = d.y >= d.ty ? Math.sin(performance.now() / 200 + d.x) * 1.5 : 0;
    ctx.fillStyle = 'rgba(26,15,28,0.35)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.ty + 6, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (d.kind === 'coin') drawCoinIcon(d.x, d.y + bob, 6);
    else if (d.kind === 'heart') drawHeartIcon(d.x, d.y + bob, 7);
    else drawBrickIcon(d.x, d.y + bob, 16, 9);
  }
}
// Kleines Fenster über der Bedienleiste: Fortschritt der Reparatur, Tipp darauf bricht ab
function drawRepairPopup() {
  if (!repair) return;
  const p = repairPopup();
  ctx.fillStyle = 'rgba(26,15,28,0.92)';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 9);
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawBrickIcon(p.x + 20, p.y + p.h / 2, 18, 10);
  comicText('Reparatur', p.x + 36, p.y + 15, 11, '#ffffff', 'left');
  hpBar(p.x + 36 + 58, p.y + 23, 116, 6, repair.t / T.repairTime, '#e3aa5c');
  // Abbrechen
  const cx = p.x + p.w - 17;
  const cy = p.y + p.h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = BLOOD_HI;
  ctx.fill();
  inkStroke(2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 4);
  ctx.lineTo(cx + 4, cy + 4);
  ctx.moveTo(cx + 4, cy - 4);
  ctx.lineTo(cx - 4, cy + 4);
  ctx.stroke();
}

// Höllentor von oben: glühender Riss im Boden mit kreisender Glut, öffnet und schließt sich
function drawPortals() {
  const total = T.portalTime + T.portalClose;
  for (const p of portals) {
    const open = p.age < 0.25 ? p.age / 0.25 : p.age > T.portalTime ? Math.max(0, (total - p.age) / T.portalClose) : 1;
    if (open <= 0) continue;
    const rx = 24 * open;
    const ry = 13 * open;
    const spin = p.age * 7;
    ctx.fillStyle = 'rgba(255,90,31,0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx + 10, ry + 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5a1f';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    inkStroke(2.5);
    ctx.fillStyle = '#2a0a10';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * 0.68, ry * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    // kreisende Glutbögen
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a = spin + (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx * 0.84, ry * 0.8, 0, a, a + 1.1);
      ctx.stroke();
    }
  }
}

// Levelübersicht: Blöcke zu fünf Leveln, jeder beginnt mit einem Checkpoint. Gesperrte Blöcke zeigen
// schon, was kommt, lassen sich aber erst starten, wenn das Spiel bis dorthin gekommen ist.
function drawMenu() {
  ctx.fillStyle = '#2a1626';
  ctx.fillRect(0, 0, T.W, H);
  comicText('SCHROTTWALL', T.W / 2, T.topY + 18, 30, '#ffd23f');
  drawCoinIcon(T.W / 2 - 34, T.topY + 44, 7);
  comicText(`${coins}`, T.W / 2 - 22, T.topY + 49, 14, '#ffffff', 'left');
  comicText(`Rekord ${record}`, T.W / 2 + 46, T.topY + 49, 11, '#b9a6c2');

  const top = T.topY + 66;
  const avail = H - T.ctrlH - top - 34;
  const count = 6;
  const gap = 7;
  const h = Math.min(66, (avail - gap * (count - 1)) / count);
  const per = T.checkpointEvery;
  // zwei freigeschaltete Blöcke vor dem aktuellen zeigen, der Rest ist Vorschau
  const firstBlock = Math.max(0, Math.floor((checkpoint - 1) / per) - 2);
  menuCards = [];
  for (let i = 0; i < count; i++) {
    const from = (firstBlock + i) * per + 1;
    const to = from + per - 1;
    const open = from <= checkpoint;
    const y = top + i * (h + gap);
    const card: MenuCard = { x: 16, y, w: T.W - 32, h, level: from, open };
    menuCards.push(card);
    ctx.beginPath();
    ctx.roundRect(card.x, y, card.w, h, 10);
    ctx.fillStyle = open ? (from === checkpoint ? '#5a3a4c' : '#432c3e') : '#30202c';
    ctx.fill();
    inkStroke(2.5);
    comicText(`Level ${from}–${to}`, card.x + 12, y + 22, 15, open ? '#ffffff' : '#8a7896', 'left');
    // Vorschau: welche Gegner in diesem Block vorkommen
    const kinds = new Set<EnemyKind>();
    let hasBoss = false;
    for (let n = from; n <= to; n++) {
      const plan = levelPlan(n);
      if (plan.boss) hasBoss = true;
      plan.kinds.forEach((k) => kinds.add(k));
    }
    let ix = card.x + 22;
    const iy = y + h - 16;
    ctx.globalAlpha = open ? 1 : 0.55;
    for (const k of ['grunt', 'bomber', 'tank', 'sniper'] as EnemyKind[]) {
      if (!kinds.has(k)) continue;
      drawDemon(ix, iy, 8, KIND_COLOR[k], k === 'sniper' ? BLOOD_HI : '#ffd23f', k === 'tank' ? 1.4 : 1);
      ix += 24;
    }
    if (hasBoss) comicText('BOSS', ix + 6, iy + 5, 12, BLOOD_HI, 'left');
    ctx.globalAlpha = 1;
    // rechts: Start oder Schloss
    const bx = card.x + card.w - 46;
    const by = y + h / 2;
    if (open) {
      ctx.beginPath();
      ctx.roundRect(bx - 30, by - 15, 64, 30, 15);
      ctx.fillStyle = BLOOD_HI;
      ctx.fill();
      inkStroke(2.5);
      comicText(from === checkpoint ? 'START' : 'NOCHMAL', bx + 2, by + 5, from === checkpoint ? 13 : 10, '#ffffff');
    } else {
      ctx.fillStyle = '#8a7896';
      ctx.beginPath();
      ctx.roundRect(bx - 9, by - 3, 18, 14, 3);
      ctx.fill();
      inkStroke(2);
      ctx.beginPath();
      ctx.arc(bx, by - 3, 6, Math.PI, 0);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#8a7896';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
  comicText('Kreuz = laufen · Feuer = werfen · in die Zone = PERFEKT', T.W / 2, H - T.ctrlH - 14, 10, '#b9a6c2');
}

// Eigener Bildschirm für den Nahkampf. Platzhalter-Grafik, die richtige Animation kommt später.
function drawClash(c: Clash) {
  const cx = T.W / 2;
  const cy = T.topY + (H - T.ctrlH - T.topY) / 2;
  const e = clamp(c.energy, 0, 1);
  const col = e > 0.5 ? '#5dff8f' : e > 0.25 ? '#ffd23f' : BLOOD_HI;
  ctx.fillStyle = '#2a1626';
  ctx.fillRect(0, 0, T.W, H);
  ctx.fillStyle = `rgba(226,32,58,${(1 - e) * 0.3})`;
  ctx.fillRect(0, T.topY, T.W, H - T.ctrlH - T.topY);

  comicText('NAHKAMPF', cx, cy - 135, c.intro > 0 ? 30 + c.intro * 30 : 30, BLOOD_HI);

  // Energiekreis: Bogen = Energie, dünner Außenring = durchgehaltene Zeit
  const r = 88 + c.pulse * 5;
  const a0 = -Math.PI / 2;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#4a3b52';
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a0 + e * Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 17, a0, a0 + (c.t / T.clashTime) * Math.PI * 2);
  ctx.stroke();

  // Tauziehen: der Berührpunkt wandert mit der Energie
  const px = cx + (e - 0.5) * 70;
  const jx = rand(-1.5, 1.5);
  ctx.fillStyle = '#2fd0c0';
  ctx.beginPath();
  ctx.arc(px - 14 + jx, cy - 36, 11, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(2.5);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(px - 14 + jx, cy - 36, 6, 0, Math.PI * 2);
  ctx.fill();
  inkStroke(2);
  drawDemon(px + 15 + jx, cy - 36, 13, '#e0364a', '#ffd23f');

  comicText(Math.max(0, T.clashTime - c.t).toFixed(1), cx, cy + 28, 40, '#ffffff');
  comicText('Sekunden durchhalten', cx, cy + 48, 11, '#d9c9e2');
  if (c.intro <= 0 && Math.floor(performance.now() / 180) % 2 === 0) {
    comicText('FEUER schnell tippen!', cx, cy + 142, 19, '#ffd23f');
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sx = shake > 0 ? rand(-shake, shake) * 0.6 : 0;
  const sy = shake > 0 ? rand(-shake, shake) * 0.6 : 0;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX + sx * scale), dpr * (offY + sy * scale));
  if (clash) {
    drawClash(clash);
    drawControls();
    return;
  }
  if (!started && !testStart) {
    drawMenu();
    drawControls();
    return;
  }

  // Arena: Steinboden mit Fugen, dunkle Mauern
  ctx.fillStyle = '#4b3b52';
  ctx.fillRect(0, 0, T.W, H);
  ctx.strokeStyle = '#3f3147';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = T.topY + 40; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(T.W, y); }
  for (let y = T.topY, row = 0; y < H; y += 40, row++) {
    for (let x = row % 2 === 0 ? 45 : 90; x < T.W; x += 90) { ctx.moveTo(x, y); ctx.lineTo(x, y + 40); }
  }
  ctx.stroke();
  // Blutflecken bleiben liegen
  ctx.fillStyle = BLOOD;
  ctx.globalAlpha = 0.85;
  for (const d of decals) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    for (let k = 0; k < 3; k++) {
      const a = d.a + k * 2.1;
      ctx.moveTo(d.x + Math.cos(a) * d.r * 1.5 + d.r * 0.4, d.y + Math.sin(a) * d.r * 1.5);
      ctx.arc(d.x + Math.cos(a) * d.r * 1.5, d.y + Math.sin(a) * d.r * 1.5, d.r * 0.4, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#241628';
  ctx.fillRect(0, 0, T.W, T.topY);
  ctx.fillRect(0, T.topY, 4, H);
  ctx.fillRect(T.W - 4, T.topY, 4, H);
  ctx.fillStyle = '#6d5a78';
  ctx.fillRect(0, T.topY - 2, T.W, 2);

  // Deckungen: Betonklötze der Gegner, Holzbarrikaden des Spielers
  covers.forEach((c, i) => {
    const mine = c.row >= 0;
    const docked = i === player.cover;
    const x0 = c.x - c.w / 2;
    const y0 = c.y - c.h / 2;
    if (c.dead) {
      // Trümmer
      ctx.fillStyle = '#5a3a1c';
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(x0 + 6 + k * (c.w - 12) / 4, c.y + (k % 2 === 0 ? -2 : 3), 3 + (k % 3), 0, Math.PI * 2);
        ctx.fill();
        inkStroke(1.5);
      }
      return;
    }
    // Andock-Zone, solange die Figur frei läuft
    if (c.row === player.row && player.cover < 0 && player.vert === 0) {
      ctx.fillStyle = 'rgba(255,210,63,0.1)';
      ctx.fillRect(x0 - T.snapRange, c.y + c.h / 2, c.w + T.snapRange * 2, COVER_GAP + 30);
    }
    if (docked) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x0 - 4, y0 - 4, c.w + 8, c.h + 8);
    }
    const frac = c.maxHp > 0 ? clamp(c.hp / c.maxHp, 0, 1) : 1;
    ctx.beginPath();
    ctx.rect(x0, y0, c.w, c.h);
    ctx.fillStyle = mine ? '#5a3a1c' : '#9a96a8';
    ctx.fill();
    if (mine) {
      // heiles Holz schrumpft mit dem Schaden zur Mitte hin
      ctx.fillStyle = '#c98a3c';
      ctx.fillRect(c.x - (c.w / 2) * frac, y0, c.w * frac, c.h);
      ctx.fillStyle = '#e3aa5c';
      ctx.fillRect(c.x - (c.w / 2) * frac, y0, c.w * frac, c.h * 0.3);
    } else {
      ctx.fillStyle = '#bdb9c9';
      ctx.fillRect(x0, y0, c.w, c.h * 0.35);
    }
    ctx.beginPath();
    ctx.rect(x0, y0, c.w, c.h);
    inkStroke(2.5);
    // Planken bzw. Risse
    ctx.beginPath();
    for (let x = x0 + 15; x < x0 + c.w - 4; x += 15) { ctx.moveTo(x, y0); ctx.lineTo(x + (mine ? 0 : 3), y0 + c.h); }
    inkStroke(1.2);
  });

  drawPortals();

  // Gegner
  for (const en of enemies) {
    if (en.spawnT > 0) {
      // steigt aus dem Tor: wächst in der zweiten Hälfte der Öffnungszeit heran
      const g = clamp(((T.portalTime - en.spawnT) / T.portalTime) * 2 - 1, 0, 1);
      if (g <= 0) continue;
      ctx.save();
      ctx.globalAlpha = g;
      ctx.translate(en.x, en.y);
      ctx.scale(g, g);
      drawDemon(0, 0, T.kinds[en.kind].r, KIND_COLOR[en.kind], '#ffd23f', en.kind === 'tank' ? 1.4 : en.kind === 'sniper' ? 0.5 : 1);
      ctx.restore();
      continue;
    }
    if (en.state === 'aim') {
      // Vorwarnung: Ziellinie wird bis zum Schuss kräftiger
      ctx.strokeStyle = `rgba(226,32,58,${0.2 + 0.6 * (1 - clamp(en.timer / T.kinds[en.kind].aim, 0, 1))})`;
      ctx.lineWidth = en.kind === 'sniper' ? 3 : en.kind === 'tank' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(en.x, en.y);
      ctx.lineTo(player.x, bodyY());
      ctx.stroke();
    }
    // Orange = setzt zum Nahkampf an bzw. stürmt
    const rush = en.state === 'charge' || en.vault > 0;
    const er = T.kinds[en.kind].r;
    // Selbstzerstörer blinken, je näher an der Figur desto schneller
    const near = Math.hypot(en.x - player.x, en.y - bodyY());
    const blink = en.kind === 'bomber' && Math.floor(performance.now() / (near < 140 ? 70 : 180)) % 2 === 0;
    const body = en.flash > 0 ? '#ffffff' : rush || blink ? '#ff8a1f' : KIND_COLOR[en.kind];
    drawDemon(en.x, en.y, er, body, en.kind === 'sniper' ? BLOOD_HI : '#ffd23f', en.kind === 'tank' ? 1.4 : en.kind === 'sniper' ? 0.5 : 1);
    if (rush) comicText('!', en.x, en.y - er - 14, 20, '#ffd23f');
    hpBar(en.x, en.y - er - 9, er * 1.75, 3, en.hp / en.maxHp, BLOOD_HI);
  }

  // Boss: Höllenritter
  if (boss) {
    const b = boss;
    const warn = disc.state !== 'boss' && b.fanT < T.bossFanWarn;
    if (disc.state === 'boss') {
      ctx.strokeStyle = `rgba(226,32,58,${0.3 + 0.6 * (1 - clamp(b.holdT / T.bossHold, 0, 1))})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + T.bossR);
      ctx.lineTo(disc.zone.x, disc.zone.y);
      ctx.stroke();
    }
    drawDemon(b.x, b.y, T.bossR, b.flash > 0 ? '#ffffff' : warn ? '#e8c46a' : '#b9a27c', BLOOD_HI, 1.6);
    hpBar(T.W / 2, T.topY + 8, 220, 7, b.hp / b.maxHp, BLOOD_HI);
  }

  // Kugeln: Feuerbälle
  for (const b of bullets) {
    ctx.fillStyle = '#ff5a1f';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    inkStroke(b.r > 6 ? 2.5 : 1.5);
    ctx.fillStyle = b.r < 4 ? '#ffffff' : '#ffd23f';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDrops();

  // Zu lange im Freien: pulsierender roter Ring unter der Figur, die Gegner zielen jetzt gezielt
  if (started && !gameOver && playerExposed()) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 90);
    ctx.strokeStyle = `rgba(226,32,58,${0.45 + pulse * 0.45})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(player.x, bodyY() + 8, 20 + pulse * 3, 9 + pulse * 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Spieler + Fangzone
  const py = player.y;
  const hy = handY();
  // Kette
  if (disc.state !== 'held') {
    ctx.beginPath();
    ctx.moveTo(player.x, hy);
    if (disc.state === 'fly') for (const p of disc.pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(disc.x, disc.y);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = '#bdb9c9';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Fangzone am Boden: gefüllt, sobald die Figur drinsteht; der Ring zieht sich bis zur Landung zusammen
  if (disc.state === 'return' || disc.state === 'boss') {
    const z = disc.zone;
    const nextCol = LEVEL_COLORS[Math.min(disc.level + 1, T.maxLevel)];
    const inside = inZone();
    const left = Math.hypot(z.x - disc.x, z.y - 18 - disc.y);
    ctx.fillStyle = nextCol;
    ctx.globalAlpha = inside ? 0.5 : 0.2;
    ctx.beginPath();
    ctx.ellipse(z.x, z.y + 6, z.r, z.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    inkStroke(inside ? 5 : 4);
    ctx.strokeStyle = nextCol;
    ctx.lineWidth = inside ? 3 : 2;
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(z.x, z.y + 6, z.r + left * 0.12, (z.r + left * 0.12) * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (disc.state === 'down') {
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, T.discR + 6 + Math.sin(performance.now() / 120) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawPlayer();
  const hpFrac = player.hp / T.playerHp;
  hpBar(player.x, py + 28, 44, 4, hpFrac, hpFrac > 0.5 ? '#5dff8f' : hpFrac > 0.25 ? '#ffd23f' : BLOOD_HI);

  drawAim();

  // Disc
  const dc = LEVEL_COLORS[disc.level];
  for (let i = 0; i < disc.trail.length; i++) {
    const t = disc.trail[i];
    const a = (i + 1) / disc.trail.length;
    ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = dc;
    ctx.beginPath();
    ctx.arc(t.x, t.y, T.discR * a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // In der Hand dreht die Disc mit der Figur mit
  const held = disc.state === 'held';
  const ddx = held ? player.x + Math.sin(anim.face) * 22 : disc.x;
  const ddy = held ? bodyY() - Math.cos(anim.face) * 22 + (isCovered() ? 4 : 0) : disc.y;
  const still = held || disc.state === 'down' || disc.state === 'boss';
  drawSaw(ddx, ddy, T.discR, still ? 0.3 : performance.now() / 35);

  // Effekte: Kleckse mit Kontur
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
    if (p.size >= 4) inkStroke(1.2);
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    comicText(t.text, clamp(t.x, 60, T.W - 60), t.y, t.size, t.color);
  }
  ctx.globalAlpha = 1;
  if (hurtFlash > 0) {
    ctx.fillStyle = `rgba(226,32,58,${hurtFlash * 0.25})`;
    ctx.fillRect(0, T.topY, T.W, H - T.ctrlH - T.topY);
  }

  drawRepairPopup();
  drawControls();

  // HUD: links Punkte und Serie, Mitte Level, rechts Münzen
  comicText(String(score), 12, 24, 17, '#ffffff', 'left');
  comicText(`Serie ${streak} · Best ${bestStreak}`, 12, 40, 10, streak > 0 ? LEVEL_COLORS[disc.level] : '#b9a6c2', 'left');
  drawCoinIcon(T.W - 52, 24, 7);
  comicText(`${coins}`, T.W - 40, 29, 14, '#ffffff', 'left');
  if (wave > 0 || bossMode) comicText(bossMode ? 'Boss-Test' : `Level ${Math.max(wave, runStart)}`, T.W / 2, 29, 13, '#ffd23f');
  if (bossMode && started && !gameOver && disc.level === 0 && disc.state === 'held') {
    comicText('Werfen → er schleudert sie weg → in der Zone fangen', T.W / 2, floorY() + 8, 11, '#d9c9e2');
  }
  if (started && !gameOver && waveBreak > 0) {
    ctx.globalAlpha = clamp(waveBreak * 2, 0, 1);
    comicText((wave + 1) % 10 === 0 ? 'BOSS' : `LEVEL ${wave + 1}`, T.W / 2, T.topY + (playerY() - T.topY) * 0.5, 34, '#ffd23f');
    ctx.globalAlpha = 1;
  }
  if (!started) {
    const hy2 = T.topY + (playerY() - T.topY) * 0.72;
    const lines = [
      'Im Lauf loslassen = in die Deckung rutschen',
      'Feuer = heraustreten und werfen',
      'Feuer halten = Dauerfeuer',
      'In die Fangzone laufen = PERFEKT',
      'Kreuz seitlich halten = Deckung verlassen',
      'Kreuz hoch / runter = Reihe wechseln',
    ];
    // dunkle Tafel dahinter, damit der Text nicht in den Deckungen untergeht
    ctx.fillStyle = 'rgba(26,15,28,0.88)';
    ctx.beginPath();
    ctx.roundRect(18, hy2 - 72, T.W - 36, lines.length * 21 + 22, 10);
    ctx.fill();
    ctx.strokeStyle = '#6d5a78';
    ctx.lineWidth = 2;
    ctx.stroke();
    lines.forEach((l, i) => comicText(l, T.W / 2, hy2 - 50 + i * 21, 12.5, '#ffffff'));
  }
  if (gameOver) {
    ctx.fillStyle = 'rgba(26,15,28,0.8)';
    ctx.fillRect(0, 0, T.W, H);
    comicText(won ? 'BOSS BESIEGT' : 'GEFALLEN', T.W / 2, H / 2 - 34, 32, won ? '#5dff8f' : BLOOD_HI);
    comicText(bossMode ? `Punkte ${score}` : `Level ${wave} · Punkte ${score}`, T.W / 2, H / 2 + 4, 17, '#ffffff');
    const rec = score >= record && score > 0;
    comicText(rec ? 'Neuer Rekord!' : `Rekord ${record}`, T.W / 2, H / 2 + 30, 14, rec ? '#ffd23f' : '#b9a6c2');
    comicText(testStart ? 'Tippen für Neustart' : 'Tippen → Levelübersicht', T.W / 2, H / 2 + 62, 14, '#ffffff');
  }
}

// ---------- Rahmen ----------
// Am Desktop steht rechts die Regler-Leiste; das Spielfeld bekommt den Rest der Breite
const tunerW = initTuner(T);
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const iw = Math.max(200, window.innerWidth - tunerW);
  const ih = window.innerHeight;
  if (tunerW > 0) canvas.style.width = `${iw}px`;
  canvas.width = Math.round(iw * dpr);
  canvas.height = Math.round(ih * dpr);
  H = clamp((T.W * ih) / iw, 560, 820);
  scale = Math.min(iw / T.W, ih / H);
  offX = (iw - T.W * scale) / 2;
  offY = (ih - H * scale) / 2;
  layout();
}
window.addEventListener('resize', resize);
resize();
reset();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  if (freeze > 0) freeze -= dt;
  else if (!gameOver && started) { if (clash) updateClash(dt); else update(dt); }
  // Musik folgt der Lage: Pause und Game Over ruhig, Kampf voll, Boss und Nahkampf am dichtesten
  setMusicIntensity(!started || gameOver ? 0 : clash || boss ? 2 : waveBreak > 0 ? 0 : 1);
  updateFx(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
