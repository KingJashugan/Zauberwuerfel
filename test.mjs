// Tests: node test.mjs
// Prüft das Würfelmodell, alle Lektionen und die Lehr-Regeln der oberen Schicht per Simulation.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const W = require('./cube.js');
const LEKTIONEN = require('./lessons.js');

let ok = 0;
function test(name, fn) {
  try { fn(); ok++; console.log('  ok   ' + name); }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + (e && e.message)); process.exitCode = 1; }
}

/* ---------- Modell ---------- */
test('gelöster Würfel hat 54 Aufkleber und ist gelöst', () => {
  const s = W.neu();
  assert.equal(s.length, 54);
  assert.ok(W.geloest(s));
});
test('jeder Zug viermal ergibt den Ausgangszustand', () => {
  for (const z of ['U', 'D', 'F', 'B', 'R', 'L']) {
    const s = W.neu(); W.wende(s, z + ' ' + z + ' ' + z + ' ' + z);
    assert.ok(W.geloest(s), z);
  }
});
test('Zug und Gegenzug heben sich auf, Doppelzug = zweimal', () => {
  for (const z of ['U', 'D', 'F', 'B', 'R', 'L']) {
    const s = W.neu(); W.wende(s, z + " " + z + "'");
    assert.ok(W.geloest(s), z);
    const a = W.neu(), b = W.neu(); W.wende(a, z + '2'); W.wende(b, z + ' ' + z);
    assert.deepEqual(a, b);
  }
});
test('Drehrichtung: U bringt vorne nach links, R bringt vorne nach oben, F bringt oben nach rechts', () => {
  let s = W.neu(); W.wende(s, 'U');
  assert.equal(W.steinPlatz(s, 'UF').platz, 'UL');
  s = W.neu(); W.wende(s, 'R');
  assert.equal(W.steinPlatz(s, 'FR').platz, 'UR');
  s = W.neu(); W.wende(s, 'F');
  assert.equal(W.steinPlatz(s, 'UF').platz, 'FR');
});
test('Klammern und Wiederholungen werden aufgelöst, Invertieren stimmt', () => {
  assert.deepEqual(W.zerlege("(R' D')2 U2"), ["R'", "D'", "R'", "D'", 'U2']);
  assert.equal(W.invertiere("R U2 F'"), "F U2 R'");
  assert.throws(() => W.zerlege('R X'));
  assert.throws(() => W.zerlege('(R U'));
});
test('bekannte Ordnungen: Sexy Move 6, R U 105, Eckendreher 6', () => {
  assert.equal(W.ordnung("R U R' U'"), 6);
  assert.equal(W.ordnung('R U'), 105);
  assert.equal(W.ordnung("R' D' R D"), 6);
});

/* ---------- Algorithmen: was sie bewirken ---------- */
const A = {
  kreuz: "F R U R' U' F'",
  kanten: "R U R' U R U2 R' U",
  ecken: "U R U' L' U R' U' L",
  dreher: "R' D' R D",
  sune: "R U R' U R U2 R'",
  t: "R U R' U' R' F R2 U' R' U' R U R' F'",
  y: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
};
const EBENEN_UNTEN = ['DF', 'DR', 'DB', 'DL', 'DFR', 'DFL', 'DBR', 'DBL', 'FR', 'FL', 'BR', 'BL'];
function bewegt(alg, steine) {
  const base = W.neu(), s = W.neu(); W.wende(s, alg);
  return steine.filter((st) => {
    const a = W.steinPlatz(s, st), b = W.steinPlatz(base, st);
    return a.platz !== b.platz || a.aufkleber !== b.aufkleber;
  });
}
const OBEN = ['UF', 'UR', 'UB', 'UL', 'UFR', 'UFL', 'UBR', 'UBL'];
test('Gelbes-Kreuz-, Kanten-, Ecken-, Sune-, T- und Y-Folge lassen die untere Hälfte unberührt', () => {
  for (const n of ['kreuz', 'kanten', 'ecken', 'sune', 't', 'y']) {
    assert.deepEqual(bewegt(A[n], EBENEN_UNTEN), [], n);
  }
});
test('Kantenfolge tauscht genau die Kanten vorne und links', () => {
  assert.deepEqual(bewegt(A.kanten, ['UF', 'UR', 'UB', 'UL']).sort(), ['UF', 'UL']);
});
test('Eckenfolge lässt vorne rechts stehen und bewegt keine Kante', () => {
  assert.deepEqual(bewegt(A.ecken, ['UF', 'UR', 'UB', 'UL']), []);
  assert.ok(!bewegt(A.ecken, ['UFR']).length);
  assert.equal(bewegt(A.ecken, ['UFL', 'UBR', 'UBL']).length, 3);
});
test('T-Perm tauscht rechte und linke Kante sowie die beiden rechten Ecken, sonst nichts', () => {
  assert.deepEqual(bewegt(A.t, OBEN).sort(), ['UBR', 'UFR', 'UL', 'UR']);
});
test('Y-Perm tauscht die Kanten hinten und links sowie die Ecken vorne rechts und hinten links', () => {
  assert.deepEqual(bewegt(A.y, OBEN).sort(), ['UB', 'UBL', 'UFR', 'UL']);
});

/* ---------- Simulation der Lehr-Regeln für die obere Schicht ---------- */
const SEITE = { UF: [0, 0, 1], UR: [1, 0, 0], UB: [0, 0, -1], UL: [-1, 0, 0] };
const POS = { UF: [0, 1, 1], UR: [1, 1, 0], UB: [0, 1, -1], UL: [-1, 1, 0] };
const ECKEN = { UFR: [1, 1, 1], UFL: [-1, 1, 1], UBR: [1, 1, -1], UBL: [-1, 1, -1] };
const stickerAn = (s, p, n) => s.find((a) => a.p.join() === p.join() && a.n.join() === n.join());
const gelbOben = (s, p) => stickerAn(s, p, [0, 1, 0]).c === 'U';
const kanteOk = (s, slot) => W.flaechenName(SEITE[slot]) === stickerAn(s, POS[slot], SEITE[slot]).c;
function eckeOk(s, slot) {
  const p = ECKEN[slot];
  const ist = s.filter((a) => a.p.join() === p.join()).map((a) => a.c).sort().join('');
  const soll = ['U', p[2] === 1 ? 'F' : 'B', p[0] === 1 ? 'R' : 'L'].sort().join('');
  return ist === soll;
}
/* Würfel gedreht halten: Zugbuchstaben umbenennen (k-mal um die senkrechte Achse) */
const NACH = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' };
function halte(alg, k) {
  return W.zerlege(alg).map((z) => { let b = z.charAt(0); for (let i = 0; i < k; i++) b = NACH[b]; return b + z.slice(1); }).join(' ');
}
function tauschplaetze(alg, k, slots, ok2) {
  const s = W.neu(); W.wende(s, halte(alg, k));
  return slots.filter((sl) => !ok2(s, sl)).sort();
}

function schritt1(s) { // Gelbes Kreuz
  let n = 0;
  for (;;) {
    const oben = Object.keys(POS).filter((sl) => gelbOben(s, POS[sl]));
    if (oben.length === 4) return n;
    if (n > 5) throw new Error('Kreuz: zu viele Durchgänge');
    if (oben.length === 2) {
      const gegenueber = (oben.includes('UF') && oben.includes('UB')) || (oben.includes('UL') && oben.includes('UR'));
      if (gegenueber) { if (oben.includes('UF')) W.wende(s, 'U'); }
      else { let t = 0; while (!(gelbOben(s, POS.UB) && gelbOben(s, POS.UL))) { W.wende(s, 'U'); if (++t > 4) throw new Error('L nicht ausrichtbar'); } }
    }
    W.wende(s, A.kreuz); n++;
  }
}
function ausrichten(s) { // U drehen, bis möglichst viele Kanten passen
  let best = -1, bu = 0;
  for (let u = 0; u < 4; u++) {
    const t = W.kopie(s); W.wende(t, Array(u).fill('U').join(' '));
    const c = Object.keys(POS).filter((sl) => kanteOk(t, sl)).length;
    if (c > best) { best = c; bu = u; }
  }
  if (bu) W.wende(s, Array(bu).fill('U').join(' '));
  return best;
}
function schritt2(s) { // Kanten an den richtigen Platz
  let n = 0;
  const PAARE = [['UB', 'UR'], ['UR', 'UF'], ['UF', 'UL'], ['UL', 'UB']]; // Nachbarn
  for (;;) {
    const c = ausrichten(s);
    if (c === 4) return n;
    if (n > 4) throw new Error('Kanten: zu viele Durchgänge');
    const falsch = Object.keys(POS).filter((sl) => !kanteOk(s, sl)).sort();
    let k = 0;
    if (c === 2 && PAARE.some((p) => p.every((sl) => falsch.includes(sl)))) {
      k = [0, 1, 2, 3].find((i) => tauschplaetze(A.kanten, i, Object.keys(POS), kanteOk).join() === falsch.join());
      if (k === undefined) throw new Error('keine Haltung gefunden');
    }
    W.wende(s, halte(A.kanten, k)); n++;
  }
}
function schritt3(s) { // Ecken an den richtigen Platz
  let n = 0;
  for (;;) {
    const ok3 = Object.keys(ECKEN).filter((sl) => eckeOk(s, sl));
    if (ok3.length === 4) return n;
    if (n > 3) throw new Error('Ecken: zu viele Durchgänge');
    let k = 0;
    if (ok3.length === 1) {
      k = [0, 1, 2, 3].find((i) => {
        const t = W.neu(); W.wende(t, halte(A.ecken, i));
        const fest = Object.keys(ECKEN).filter((sl) => eckeOk(t, sl));
        return fest.length === 1 && fest[0] === ok3[0];
      });
      if (k === undefined) throw new Error('keine Haltung für Ecke ' + ok3[0]);
    }
    W.wende(s, halte(A.ecken, k)); n++;
  }
}
function schritt4(s) { // Ecken drehen
  let n = 0;
  for (let i = 0; i < 4; i++) {
    let r = 0;
    while (!gelbOben(s, ECKEN.UFR)) { W.wende(s, A.dreher); n++; if (++r > 5) throw new Error('Eckendreher: kein Ende'); }
    if (r !== 0 && r !== 2 && r !== 4) throw new Error('Eckendreher: ' + r + ' Durchgänge statt 0, 2 oder 4');
    W.wende(s, 'U');
  }
  return n;
}

/* Zufällige Zustände der oberen Schicht: nur Folgen, die die untere Hälfte unberührt lassen */
function zufall(seed) {
  let x = seed;
  const rnd = (m) => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x % m; };
  const bausteine = ['U', "U'", 'U2', A.kreuz, A.kanten, A.ecken, A.sune, A.t, A.y,
    "(R' D' R D)2 U (R' D' R D)4 U'", "(R' D' R D)4 U (R' D' R D)2 U'"];
  const s = W.neu();
  for (let i = 0; i < 14; i++) W.wende(s, bausteine[rnd(bausteine.length)]);
  return s;
}
test('Lehr-Regeln lösen 600 zufällige Zustände der oberen Schicht vollständig', () => {
  const max = [0, 0, 0, 0];
  let nichtGeloest = 0;
  for (let i = 1; i <= 600; i++) {
    const s = zufall(i * 7919);
    const bef = EBENEN_UNTEN.every((st) => W.steinPlatz(s, st).platz === W.steinPlatz(W.neu(), st).platz);
    assert.ok(bef, 'untere Hälfte beim Start intakt');
    const a = schritt1(s), b = schritt2(s), c = schritt3(s), d = schritt4(s);
    max[0] = Math.max(max[0], a); max[1] = Math.max(max[1], b); max[2] = Math.max(max[2], c); max[3] = Math.max(max[3], d);
    if (!W.geloest(s)) nichtGeloest++;
  }
  assert.equal(nichtGeloest, 0, nichtGeloest + ' Zustände nicht gelöst');
  console.log('       Höchstzahl der Anwendungen (Kreuz, Kanten, Ecken, Eckendreher-Durchgänge):', max.join(', '));
});

/* ---------- Lektionen ---------- */
function demoZuege(d) { return d.gruppen.map((g) => g.zuege).join(' '); }
function demoStart(d) { const s = W.neu(); W.wende(s, d.start === undefined ? W.invertiere(demoZuege(d)) : d.start); return s; }
const demos = [];
LEKTIONEN.forEach((l) => (l.abschnitte || []).forEach((a) => { if (a.demo) demos.push([l, a.demo]); }));

test('es gibt Lektionen mit eindeutigen Kennungen und Pflichtfeldern', () => {
  assert.ok(LEKTIONEN.length >= 10);
  const ids = new Set();
  LEKTIONEN.forEach((l) => {
    assert.ok(l.id && l.titel && l.ziel, 'Pflichtfelder: ' + l.id);
    assert.ok(!ids.has(l.id), 'doppelt: ' + l.id); ids.add(l.id);
    assert.ok(Array.isArray(l.abschnitte) && l.abschnitte.length, l.id);
  });
});
test('jede Demo ist spielbar und endet im gelösten Würfel', () => {
  assert.ok(demos.length >= 15);
  demos.forEach(([l, d]) => {
    assert.ok(d.titel && d.vorher && d.nachher, l.id + ': ' + d.titel + ' braucht Titel, vorher, nachher');
    assert.ok(d.gruppen.length, d.titel);
    d.gruppen.forEach((g) => { assert.ok(g.text && g.zuege, l.id + '/' + d.titel + ': Gruppe ohne Text'); W.zerlege(g.zuege); });
    const s = demoStart(d); W.wende(s, demoZuege(d));
    assert.ok(W.geloest(s), l.id + ' / ' + d.titel + ' endet nicht gelöst');
  });
});
test('Demos starten nie im gelösten Zustand (es gäbe nichts zu sehen)', () => {
  demos.forEach(([l, d]) => assert.ok(!W.geloest(demoStart(d)), l.id + ' / ' + d.titel));
});
test('Texte enthalten keine Entwurfsreste', () => {
  const alle = JSON.stringify(LEKTIONEN);
  for (const w of ['TODO', 'XXX', 'lorem', 'undefined']) assert.ok(!alle.includes(w), w);
});

console.log('\n' + ok + ' Tests bestanden' + (process.exitCode ? ' – es gibt Fehler' : ''));
