// Dauerhafte Upgrades aus dem Shop. Gekauft wird mit Münzen, aber gebremst durch den Fortschritt:
// pro zehn Level höchstens ein Upgrade, das erste schon nach Level 5 (also nach 5, 15, 25 …).
// Jedes Upgrade wird mit seiner eigenen Stufe teurer; die erste Stufe ist überall gleich günstig.

export interface UpgradeDef { id: string; name: string; desc: string; tiers: number }

export const UPGRADES: UpgradeDef[] = [
  { id: 'cooling', name: 'Kühlrippen', desc: 'Säge heizt 15 % weniger auf, kühlt schneller ab', tiers: 3 },
  { id: 'armor', name: 'Verstärkte Barrikaden', desc: '+25 % Haltbarkeit deiner Deckungen', tiers: 3 },
  { id: 'vitality', name: 'Zähigkeit', desc: '+20 maximales Leben', tiers: 3 },
  { id: 'net', name: 'Fangnetz', desc: 'Fangzone 15 % größer', tiers: 3 },
  { id: 'bricks', name: 'Ziegeltasche', desc: '+2 Ziegel, 25 % schneller reparieren', tiers: 2 },
];
const PRICES = [15, 35, 60, 90]; // Preis für Stufe 1, 2, 3 … eines Upgrades

const KEY = 'schrottwall.upgrades';
let owned: Record<string, number> = {};
try { owned = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>; } catch { /* privates Fenster */ }

export const tier = (id: string) => owned[id] ?? 0;
export const boughtCount = () => Object.values(owned).reduce((a, b) => a + b, 0);
export const priceOf = (id: string) => PRICES[Math.min(tier(id), PRICES.length - 1)];

/** Wie viele Upgrades der Fortschritt bisher erlaubt (levelsDone = höchstes geschafftes Level). */
export const upgradeSlots = (levelsDone: number) => (levelsDone >= 5 ? 1 + Math.floor((levelsDone - 5) / 10) : 0);
/** Ab welchem geschafften Level der nächste Platz frei wird. */
export const nextSlotAt = (levelsDone: number) => (levelsDone < 5 ? 5 : 5 + 10 * (Math.floor((levelsDone - 5) / 10) + 1));

export function canBuy(id: string, coins: number, levelsDone: number) {
  const def = UPGRADES.find((u) => u.id === id);
  return !!def && tier(id) < def.tiers && coins >= priceOf(id) && boughtCount() < upgradeSlots(levelsDone);
}
let sandbox = false;
/** Testmodus: mit leerem Bestand beginnen und Käufe nicht speichern. */
export function sandboxUpgrades() {
  sandbox = true;
  owned = {};
}
export function buy(id: string) {
  owned[id] = tier(id) + 1;
  if (sandbox) return;
  try { localStorage.setItem(KEY, JSON.stringify(owned)); } catch { /* privates Fenster */ }
}
