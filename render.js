/* Zeichnet den Würfel als SVG: 3D-Ansicht (mit Drehanimation) und flache Draufsicht der Oberseite.
 * Benötigt cube.js (window.Wuerfel). */
(function (root) {
  'use strict';
  var W = root.Wuerfel;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var FARBCODE = {
    U: '#ffd500', D: '#f4f4f4', F: '#1fa84f', B: '#1f5fd1', R: '#ff8a00', L: '#d62828',
  };
  var GRUND = '#15171c';

  var KAMERAS = {
    oben: { yaw: -35, pitch: 28 },
    unten: { yaw: -35, pitch: -28 },
  };

  function rot(v, a, theta) {
    var c = Math.cos(theta), s = Math.sin(theta);
    var d = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
    var k = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
    return [
      v[0] * c + k[0] * s + a[0] * d * (1 - c),
      v[1] * c + k[1] * s + a[1] * d * (1 - c),
      v[2] * c + k[2] * s + a[2] * d * (1 - c),
    ];
  }

  function el(name, attrs, eltern) {
    var e = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (eltern) eltern.appendChild(e);
    return e;
  }

  function leeren(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  function flaeche(p, n, halb) {
    // vier Eckpunkte eines Quadrats auf der Außenseite des Steins
    var i = n[0] !== 0 ? 0 : n[1] !== 0 ? 1 : 2;
    var j = (i + 1) % 3, k = (i + 2) % 3;
    var mitte = [p[0] + n[0] * 0.5, p[1] + n[1] * 0.5, p[2] + n[2] * 0.5];
    return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(function (f) {
      var q = mitte.slice(); q[j] += f[0] * halb; q[k] += f[1] * halb; return q;
    });
  }

  function kamera(punkt, cam) {
    var yaw = cam.yaw * Math.PI / 180, pitch = cam.pitch * Math.PI / 180;
    var x = punkt[0] * Math.cos(yaw) + punkt[2] * Math.sin(yaw);
    var z = -punkt[0] * Math.sin(yaw) + punkt[2] * Math.cos(yaw);
    var y = punkt[1] * Math.cos(pitch) - z * Math.sin(pitch);
    var t = punkt[1] * Math.sin(pitch) + z * Math.cos(pitch);
    return [x, -y, t]; // Bildschirm-x, Bildschirm-y (nach unten), Tiefe (größer = näher)
  }

  /* anim (optional): { zug: 'R', viertel: 1..2, winkel: 0..1, richtung: 1 | -1 }
   * richtung 1 = im Uhrzeigersinn. Gedreht wird die zum Zug gehörende Schicht um winkel * viertel * 90°. */
  function zeichne3D(svg, steine, ansicht, anim) {
    var cam = KAMERAS[ansicht] || KAMERAS.oben;
    svg.setAttribute('viewBox', '-3 -3 6 6');
    leeren(svg);
    var achse = null, theta = 0;
    if (anim) {
      achse = W.schicht(anim.zug);
      theta = -anim.richtung * anim.winkel * anim.viertel * Math.PI / 2;
    }
    var liste = [];
    steine.forEach(function (a) {
      var gedreht = achse && W.inSchicht(a, achse);
      var n = gedreht ? rot(a.n, achse, theta) : a.n;
      var nz = kamera(n, { yaw: cam.yaw, pitch: cam.pitch })[2];
      if (nz <= 0.02) return; // zeigt vom Betrachter weg
      var grund = flaeche(a.p, a.n, 0.5), farbe = flaeche(a.p, a.n, 0.44);
      if (gedreht) {
        grund = grund.map(function (q) { return rot(q, achse, theta); });
        farbe = farbe.map(function (q) { return rot(q, achse, theta); });
      }
      var gp = grund.map(function (q) { return kamera(q, cam); });
      var fp = farbe.map(function (q) { return kamera(q, cam); });
      var tiefe = (gp[0][2] + gp[1][2] + gp[2][2] + gp[3][2]) / 4;
      liste.push({ gp: gp, fp: fp, c: a.c, tiefe: tiefe });
    });
    liste.sort(function (a, b) { return a.tiefe - b.tiefe; });
    function pts(p) { return p.map(function (q) { return q[0].toFixed(3) + ',' + q[1].toFixed(3); }).join(' '); }
    liste.forEach(function (s) {
      el('polygon', { points: pts(s.gp), fill: GRUND }, svg);
      el('polygon', { points: pts(s.fp), fill: FARBCODE[s.c], stroke: GRUND, 'stroke-width': '0.03', 'stroke-linejoin': 'round' }, svg);
    });
  }

  /* Draufsicht auf die obere Schicht: 3x3 Quadrate der Oberseite, davor die Seitenstreifen der oberen Schicht */
  function zeichneFlach(svg, steine) {
    svg.setAttribute('viewBox', '-2.3 -2.3 4.6 4.6');
    leeren(svg);
    var G = 0.46, S = 0.15, D = 0.2; // halbe Kantenlänge, halbe Streifenbreite, Streifenabstand zur Oberseite
    steine.forEach(function (a) {
      if (a.p[1] !== 1) return;
      var x = a.p[0], z = a.p[2];
      if (a.n[1] === 1) {
        el('rect', { x: x - G, y: z - G, width: 2 * G, height: 2 * G, rx: 0.06, fill: FARBCODE[a.c], stroke: GRUND, 'stroke-width': '0.03' }, svg);
      } else if (a.n[2] === 1) {
        el('rect', { x: x - G, y: 1.5 + D - S, width: 2 * G, height: 2 * S, rx: 0.04, fill: FARBCODE[a.c], stroke: GRUND, 'stroke-width': '0.02' }, svg);
      } else if (a.n[2] === -1) {
        el('rect', { x: x - G, y: -1.5 - D - S, width: 2 * G, height: 2 * S, rx: 0.04, fill: FARBCODE[a.c], stroke: GRUND, 'stroke-width': '0.02' }, svg);
      } else if (a.n[0] === 1) {
        el('rect', { x: 1.5 + D - S, y: z - G, width: 2 * S, height: 2 * G, rx: 0.04, fill: FARBCODE[a.c], stroke: GRUND, 'stroke-width': '0.02' }, svg);
      } else if (a.n[0] === -1) {
        el('rect', { x: -1.5 - D - S, y: z - G, width: 2 * S, height: 2 * G, rx: 0.04, fill: FARBCODE[a.c], stroke: GRUND, 'stroke-width': '0.02' }, svg);
      }
    });
  }

  function zeichne(svg, steine, ansicht, anim) {
    if (ansicht === 'flach') zeichneFlach(svg, steine);
    else zeichne3D(svg, steine, ansicht, anim);
  }

  root.Render = { zeichne: zeichne, FARBCODE: FARBCODE };
})(window);
