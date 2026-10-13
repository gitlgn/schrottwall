// Entwicklungs-Regler: blendet am Desktop eine Leiste mit allen Spielwerten aus T ein.
// Änderungen wirken sofort, werden im Browser gespeichert und lassen sich als JSON kopieren,
// um sie fest in main.ts zu übernehmen. Am Handy erscheint die Leiste nicht.

type Obj = Record<string, unknown>;

const STORE = 'schrottwall.tuning';
const WIDTH = 340;
// Werte, die das Spielfeld selbst festlegen: nicht zum Schieben gedacht
const SKIP = new Set(['W', 'topY', 'ctrlH', 'lanes']);

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

function getAt(root: Obj, path: string[]) {
  let o: unknown = root;
  for (const p of path) o = (o as Obj)[p];
  return o as number;
}
function setAt(root: Obj, path: string[], v: number) {
  let o = root;
  for (const p of path.slice(0, -1)) o = o[p] as Obj;
  o[path[path.length - 1]] = v;
}
// alle Zahlen im Objekt als Pfade, verschachtelte Tabellen eingeschlossen
function numberPaths(o: Obj, base: string[] = []): string[][] {
  const out: string[][] = [];
  for (const [k, v] of Object.entries(o)) {
    if (base.length === 0 && SKIP.has(k)) continue;
    if (typeof v === 'number') out.push([...base, k]);
    else if (isObj(v)) out.push(...numberPaths(v, [...base, k]));
  }
  return out;
}

/** Baut die Leiste, wenn sie gewünscht ist, und gibt ihre Breite zurück (0 = keine Leiste). */
export function initTuner(T: Obj): number {
  const wanted = location.search.includes('tune')
    || (matchMedia('(pointer: fine)').matches && window.innerWidth >= 900);
  if (!wanted || location.search.includes('notune')) return 0;

  const defaults = structuredClone(T) as Obj;
  const paths = numberPaths(T);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Record<string, number>;
    for (const p of paths) {
      const v = saved[p.join('.')];
      if (typeof v === 'number') setAt(T, p, v);
    }
  } catch { /* kaputter Speicher: Standardwerte bleiben */ }

  const changed = () => {
    const out: Record<string, number> = {};
    for (const p of paths) if (getAt(T, p) !== getAt(defaults, p)) out[p.join('.')] = getAt(T, p);
    return out;
  };
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(changed())); } catch { /* privates Fenster */ }
  };

  const style = document.createElement('style');
  style.textContent = `
    #tuner { position: fixed; top: 0; right: 0; bottom: 0; width: ${WIDTH}px; box-sizing: border-box;
      overflow-y: auto; background: #1a0f1c; color: #e8dff0; border-left: 3px solid #6d5a78;
      font: 12px/1.3 system-ui, sans-serif; padding: 10px 12px 40px; }
    #tuner h1 { font-size: 15px; margin: 0 0 2px; color: #ffd23f; }
    #tuner p { margin: 0 0 8px; color: #b9a6c2; }
    #tuner h2 { font-size: 12px; margin: 12px 0 4px; color: #3fd4ff; text-transform: uppercase; letter-spacing: .04em; }
    #tuner .bar { display: flex; gap: 6px; margin-bottom: 8px; }
    #tuner button, #tuner input[type=search] { font: inherit; color: inherit; background: #3a2c40;
      border: 1.5px solid #6d5a78; border-radius: 6px; padding: 5px 8px; }
    #tuner button { cursor: pointer; }
    #tuner input[type=search] { width: 100%; box-sizing: border-box; margin-bottom: 4px; }
    #tuner .row { display: grid; grid-template-columns: 118px 1fr 58px; gap: 6px; align-items: center; padding: 1px 0; }
    #tuner .row label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #tuner .row.changed label { color: #ffd23f; font-weight: 700; }
    #tuner .row input[type=range] { width: 100%; margin: 0; accent-color: #e2203a; }
    #tuner .row input[type=number] { width: 100%; box-sizing: border-box; font: inherit; color: inherit;
      background: #2a1c30; border: 1px solid #4a3b52; border-radius: 4px; padding: 2px 4px; }
  `;
  document.head.append(style);

  const el = document.createElement('div');
  el.id = 'tuner';
  el.innerHTML = `<h1>Spielwerte</h1>
    <p>Wirkt sofort und bleibt in diesem Browser gespeichert. Gelb = geändert.
    Leben und Deckung greifen erst nach einem Neustart der Runde.</p>
    <div class="bar"><button id="tuner-reset">Zurücksetzen</button><button id="tuner-copy">Geändertes kopieren</button></div>
    <input type="search" id="tuner-filter" placeholder="Filtern, z. B. boss">`;
  document.body.append(el);

  const rows: { row: HTMLElement; path: string[]; sync: () => void }[] = [];
  let group = '';
  for (const path of paths) {
    // Überschrift pro verschachtelter Tabelle (levels.0, catchZone.boss), sonst eine gemeinsame
    const g = path.length > 1 ? path.slice(0, -1).join(' · ') : 'Allgemein';
    if (g !== group) {
      group = g;
      const h = document.createElement('h2');
      h.textContent = g;
      h.dataset.group = g;
      el.append(h);
    }
    const def = getAt(defaults, path);
    const whole = Number.isInteger(def) && Math.abs(def) >= 2;
    const step = whole ? 1 : Math.abs(def) < 1 ? 0.005 : 0.05;
    const max = def === 0 ? 10 : Math.abs(def) * 3;

    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.name = path.join('.').toLowerCase();
    const label = document.createElement('label');
    label.textContent = path[path.length - 1];
    label.title = `${path.join('.')} (Standard ${def})`;
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = String(max);
    range.step = String(step);
    const num = document.createElement('input');
    num.type = 'number';
    num.step = String(step);
    const sync = () => {
      const v = getAt(T, path);
      range.value = String(v);
      num.value = String(v);
      row.classList.toggle('changed', v !== def);
    };
    const apply = (raw: string) => {
      const v = Number(raw);
      if (!Number.isFinite(v)) return;
      setAt(T, path, v);
      sync();
      save();
    };
    range.addEventListener('input', () => apply(range.value));
    num.addEventListener('change', () => apply(num.value));
    row.append(label, range, num);
    el.append(row);
    rows.push({ row, path, sync });
    sync();
  }

  el.querySelector('#tuner-reset')!.addEventListener('click', () => {
    for (const r of rows) { setAt(T, r.path, getAt(defaults, r.path)); r.sync(); }
    save();
  });
  el.querySelector('#tuner-copy')!.addEventListener('click', (e) => {
    const text = JSON.stringify(changed(), null, 2);
    navigator.clipboard?.writeText(text).catch(() => { /* kein Zugriff: steht dann in der Konsole */ });
    console.log('Geänderte Spielwerte:\n' + text);
    const b = e.currentTarget as HTMLButtonElement;
    b.textContent = 'Kopiert';
    setTimeout(() => { b.textContent = 'Geändertes kopieren'; }, 1200);
  });
  el.querySelector('#tuner-filter')!.addEventListener('input', (e) => {
    const q = (e.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    for (const r of rows) r.row.style.display = r.row.dataset.name!.includes(q) ? '' : 'none';
  });

  return WIDTH;
}
