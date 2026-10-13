/* Würfelmodell ohne Abhängigkeiten.
 * Koordinaten: x nach rechts (R), y nach oben (U), z nach vorne (F).
 * Jeder Aufkleber hat eine Position p (Mitte des Steins), eine Blickrichtung n und eine Farbe c.
 * Farben wie beim echten Würfel: Weiß unten, Gelb oben, Grün vorne, Blau hinten, Orange rechts, Rot links. */
(function (root) {
  'use strict';

  var FARBEN = { U: 'Gelb', D: 'Weiß', F: 'Grün', B: 'Blau', R: 'Orange', L: 'Rot' };
  var NORMALE = {
    U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
  };

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  function neu() {
    var s = [];
    var flaechen = Object.keys(NORMALE);
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;
      flaechen.forEach(function (f) {
        var n = NORMALE[f];
        if (dot([x, y, z], n) === 1) s.push({ p: [x, y, z], n: n.slice(), c: f });
      });
    }
    return s;
  }

  function kopie(s) {
    return s.map(function (a) { return { p: a.p.slice(), n: a.n.slice(), c: a.c }; });
  }

  /* Drehung um 90° im Uhrzeigersinn, von außen auf die Fläche gesehen: v' = a(a·v) - a×v */
  function dreheVektor(v, a, viertel) {
    var r = v.slice();
    for (var i = 0; i < viertel; i++) {
      var d = dot(a, r), k = cross(a, r);
      r = [a[0] * d - k[0], a[1] * d - k[1], a[2] * d - k[2]];
    }
    return r;
  }

  function schicht(zug) { return NORMALE[zug.charAt(0)]; }

  /* Zerlegt "R U' (R' D' R D)2 F2" in eine Liste einzelner Züge ["R","U'",...,"F2"] */
  function zerlege(text) {
    var t = String(text).replace(/\s+/g, ' ').trim();
    var pos = 0;
    function liste(ende) {
      var aus = [];
      while (pos < t.length && t.charAt(pos) !== ende) {
        var ch = t.charAt(pos);
        if (ch === ' ') { pos++; continue; }
        if (ch === '(') {
          pos++;
          var inner = liste(')');
          if (t.charAt(pos) !== ')') throw new Error('Klammer nicht geschlossen: ' + text);
          pos++;
          var m = /^\d+/.exec(t.slice(pos));
          var n = 1;
          if (m) { n = parseInt(m[0], 10); pos += m[0].length; }
          for (var i = 0; i < n; i++) aus = aus.concat(inner);
        } else if ('UDFBRL'.indexOf(ch) >= 0) {
          var z = ch; pos++;
          var nx = t.charAt(pos);
          if (nx === "'" || nx === '2') { z += nx; pos++; }
          aus.push(z);
        } else {
          throw new Error('Unbekanntes Zeichen "' + ch + '" in: ' + text);
        }
      }
      return aus;
    }
    var res = liste(null);
    if (pos < t.length) throw new Error('Unerwartete Klammer in: ' + text);
    return res;
  }

  function viertel(z) {
    return z.length === 1 ? 1 : z.charAt(1) === "'" ? 3 : 2;
  }

  function invertiere(text) {
    return zerlege(text).reverse().map(function (z) {
      if (z.length === 1) return z + "'";
      return z.charAt(1) === "'" ? z.charAt(0) : z;
    }).join(' ');
  }

  /* Gehört der Aufkleber zur gedrehten Schicht? */
  function inSchicht(a, ax) { return dot(a.p, ax) === 1; }

  function zug(s, z) {
    var ax = schicht(z), q = viertel(z);
    s.forEach(function (a) {
      if (inSchicht(a, ax)) {
        a.p = dreheVektor(a.p, ax, q);
        a.n = dreheVektor(a.n, ax, q);
      }
    });
    return s;
  }

  function wende(s, text) {
    zerlege(text).forEach(function (z) { zug(s, z); });
    return s;
  }

  /* Gelöst: jeder Aufkleber liegt auf einer Fläche, und alle Aufkleber einer Fläche haben dieselbe Farbe. */
  function geloest(s) {
    var farbe = {};
    for (var i = 0; i < s.length; i++) {
      var k = s[i].n.join();
      if (farbe[k] === undefined) farbe[k] = s[i].c;
      else if (farbe[k] !== s[i].c) return false;
    }
    return true;
  }

  function flaechenName(n) {
    for (var f in NORMALE) if (NORMALE[f].join() === n.join()) return f;
    return '?';
  }
  function platzName(p) {
    var t = '';
    if (p[1] === 1) t += 'U'; else if (p[1] === -1) t += 'D';
    if (p[2] === 1) t += 'F'; else if (p[2] === -1) t += 'B';
    if (p[0] === 1) t += 'R'; else if (p[0] === -1) t += 'L';
    return t;
  }

  /* Wo steckt der Stein mit diesen Farben (z. B. "DF" oder "DFR")?
   * Liefert Platz ("UF") und Ausrichtung je Farbe ("D→F D→U ..."). */
  function steinPlatz(s, farben) {
    var ziel = farben.split('').sort().join('');
    var gruppen = {};
    s.forEach(function (a) { var k = a.p.join(); (gruppen[k] = gruppen[k] || []).push(a); });
    var res = null;
    Object.keys(gruppen).forEach(function (k) {
      var g = gruppen[k];
      if (g.map(function (a) { return a.c; }).sort().join('') !== ziel) return;
      res = {
        platz: platzName(g[0].p),
        aufkleber: g.map(function (a) { return a.c + '→' + flaechenName(a.n); }).sort().join(' '),
      };
    });
    return res;
  }

  /* Anzahl der Wiederholungen, bis eine Zugfolge wieder den Ausgangszustand ergibt */
  function ordnung(text) {
    var s = neu(), n = 0;
    do { wende(s, text); n++; } while (!geloest(s) && n < 1000);
    return n;
  }

  var api = {
    FARBEN: FARBEN, NORMALE: NORMALE, neu: neu, kopie: kopie, zerlege: zerlege, invertiere: invertiere,
    zug: zug, wende: wende, geloest: geloest, steinPlatz: steinPlatz, ordnung: ordnung,
    dreheVektor: dreheVektor, schicht: schicht, viertel: viertel, inSchicht: inSchicht,
    flaechenName: flaechenName, platzName: platzName,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Wuerfel = api;
})(typeof window !== 'undefined' ? window : globalThis);
