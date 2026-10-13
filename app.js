/* Oberfläche: Übersicht, Lektionen, Demo-Player, freies Ausprobieren. */
(function () {
  'use strict';
  var W = window.Wuerfel, R = window.Render, LEKTIONEN = window.LEKTIONEN;
  var wurzel = document.getElementById('app');
  var KEY = 'zauberwuerfel:erledigt:v1';
  var reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- kleine Helfer ---------- */
  function h(tag, attrs, kinder) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kinder || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  /* **fett** und `Zugfolge` */
  function format(text) {
    var f = document.createDocumentFragment();
    String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach(function (t) {
      if (!t) return;
      if (t.indexOf('**') === 0) f.appendChild(h('strong', { text: t.slice(2, -2) }));
      else if (t.charAt(0) === '`') f.appendChild(h('code', { text: t.slice(1, -1) }));
      else f.appendChild(document.createTextNode(t));
    });
    return f;
  }
  function absatz(text) { var p = h('p'); p.appendChild(format(text)); return p; }

  function laden() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function speichern(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* privat/gesperrt: ignorieren */ } }

  /* Animationsdaten eines Zugs: Anzahl Viertel (1 oder 2) und Drehrichtung (1 = Uhrzeigersinn).
   * richtung -1 spielt den Zug rückwärts ab. */
  function animParam(zug, richtung) {
    var gegen = zug.charAt(1) === "'";
    return { viertel: zug.charAt(1) === '2' ? 2 : 1, richtung: (gegen ? -1 : 1) * richtung };
  }

  var speed = 'normal';
  var DAUER = { langsam: 900, normal: 520, schnell: 220 };
  function dauer() { return reduziert ? 0 : DAUER[speed]; }

  /* ---------- Würfel-Bild mit Ansichtswahl ---------- */
  function wuerfelBild(startAnsicht, steine) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'cube-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Zauberwürfel');
    var ansicht = startAnsicht || 'oben';
    var aktuell = steine;
    var knoepfe = {};
    var leiste = h('div', { class: 'seg', role: 'group', 'aria-label': 'Ansicht' });
    [['oben', 'Von oben'], ['unten', 'Von unten'], ['flach', 'Flach']].forEach(function (a) {
      var b = h('button', { type: 'button', class: 'seg-btn', text: a[1], 'data-ansicht': a[0] });
      b.addEventListener('click', function () { setzeAnsicht(a[0]); });
      knoepfe[a[0]] = b; leiste.appendChild(b);
    });
    function markiere() {
      Object.keys(knoepfe).forEach(function (k) { knoepfe[k].setAttribute('aria-pressed', String(k === ansicht)); });
    }
    function zeige(s, anim) { aktuell = s; R.zeichne(svg, s, ansicht, anim); }
    function setzeAnsicht(a) { ansicht = a; markiere(); zeige(aktuell); }
    markiere(); zeige(steine);
    return { svg: svg, leiste: leiste, zeige: zeige, ansicht: function () { return ansicht; } };
  }

  /* ---------- Demo-Player ---------- */
  function demoPlayer(demo) {
    var zuege = [], gruppeVon = [];
    demo.gruppen.forEach(function (g, gi) {
      W.zerlege(g.zuege).forEach(function (z) { zuege.push(z); gruppeVon.push(gi); });
    });
    var start = W.neu();
    W.wende(start, demo.start !== undefined ? demo.start : W.invertiere(zuege.join(' ')));
    var zustaende = [start];
    zuege.forEach(function (z, i) { var s = W.kopie(zustaende[i]); W.zug(s, z); zustaende.push(s); });

    var idx = 0, lauf = null, laeuft = false;
    var bild = wuerfelBild(demo.ansicht, start);
    var status = h('p', { class: 'status', 'aria-live': 'polite' });
    var zaehler = h('span', { class: 'zaehler' });
    var chips = h('div', { class: 'chips', 'aria-label': 'Zugfolge' });
    var chipEl = zuege.map(function (z, i) {
      var c = h('button', { type: 'button', class: 'chip', text: z, 'aria-label': 'Springe zu Zug ' + (i + 1) + ': ' + z });
      c.addEventListener('click', function () { stopp(); springe(i + 1); });
      if (i > 0 && gruppeVon[i] !== gruppeVon[i - 1]) c.classList.add('gruppe-anfang');
      chips.appendChild(c); return c;
    });
    var btn = {};
    function knopf(name, text, fn) {
      btn[name] = h('button', { type: 'button', class: 'btn', text: text, 'data-aktion': name });
      btn[name].addEventListener('click', fn);
      return btn[name];
    }

    function ausgabe() {
      var ende = idx === zuege.length;
      status.textContent = '';
      var kopf = h('strong', { text: idx === 0 ? 'Ausgangslage: ' : ende ? 'Ergebnis: ' : 'Schritt ' + idx + ': ' });
      status.appendChild(kopf);
      status.appendChild(document.createTextNode(idx === 0 ? demo.vorher : ende ? demo.nachher : demo.gruppen[gruppeVon[idx - 1]].text));
      zaehler.textContent = 'Zug ' + idx + ' von ' + zuege.length;
      chipEl.forEach(function (c, i) {
        c.classList.toggle('gespielt', i < idx);
        c.classList.toggle('naechster', i === idx);
        if (i === idx) c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current');
      });
      btn.zurueck.disabled = btn.anfang.disabled = idx === 0;
      btn.weiter.disabled = ende;
      btn.abspielen.textContent = laeuft ? 'Pause' : (ende ? 'Nochmal' : 'Abspielen');
      bild.svg.setAttribute('aria-label', 'Zauberwürfel nach Zug ' + idx + ' von ' + zuege.length);
    }
    function stoppAnimation() { if (lauf) { cancelAnimationFrame(lauf.raf); lauf = null; } }
    function springe(i) { stoppAnimation(); idx = i; bild.zeige(zustaende[idx]); ausgabe(); }
    function stopp() { laeuft = false; stoppAnimation(); bild.zeige(zustaende[idx]); ausgabe(); }

    /* Ein Zug animieren; richtung 1 = vor, -1 = zurück. fertig() wird nach Abschluss aufgerufen. */
    function schritt(richtung, fertig) {
      stoppAnimation();
      var ziel = idx + richtung;
      if (ziel < 0 || ziel > zuege.length) { if (fertig) fertig(); return; }
      var zug = richtung === 1 ? zuege[idx] : zuege[idx - 1];
      var p = animParam(zug, richtung);
      var d = dauer();
      function ende() { lauf = null; idx = ziel; bild.zeige(zustaende[idx]); ausgabe(); if (fertig) fertig(); }
      if (d === 0) { ende(); return; }
      var t0 = null;
      lauf = { raf: 0 };
      function tick(zeit) {
        if (t0 === null) t0 = zeit;
        var t = Math.min(1, (zeit - t0) / (d * (p.viertel === 2 ? 1.4 : 1)));
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // weich anfahren und abbremsen
        bild.zeige(zustaende[idx], { zug: zug, viertel: p.viertel, winkel: e, richtung: p.richtung });
        if (t < 1) lauf.raf = requestAnimationFrame(tick); else ende();
      }
      lauf.raf = requestAnimationFrame(tick);
    }
    function abspielen() {
      if (laeuft) { stopp(); return; }
      if (idx === zuege.length) springe(0);
      laeuft = true; ausgabe();
      (function weiter() {
        if (!laeuft) return;
        if (idx >= zuege.length) { laeuft = false; ausgabe(); return; }
        schritt(1, function () { if (laeuft) setTimeout(weiter, reduziert ? 0 : 120); });
      })();
    }

    var steuerung = h('div', { class: 'controls' }, [
      knopf('anfang', 'Anfang', function () { stopp(); springe(0); }),
      knopf('zurueck', 'Zurück', function () { stopp(); schritt(-1); }),
      knopf('weiter', 'Weiter', function () { stopp(); schritt(1); }),
      knopf('abspielen', 'Abspielen', abspielen),
    ]);
    btn.abspielen.classList.add('primary');
    var tempo = h('label', { class: 'tempo' }, ['Tempo ', (function () {
      var s = h('select', { 'aria-label': 'Tempo' });
      [['langsam', 'langsam'], ['normal', 'normal'], ['schnell', 'schnell']].forEach(function (o) {
        var op = h('option', { value: o[0], text: o[1] }); if (o[0] === speed) op.selected = true; s.appendChild(op);
      });
      s.addEventListener('change', function () { speed = s.value; });
      return s;
    })()]);

    var karte = h('section', { class: 'demo' }, [
      h('h4', { text: demo.titel }),
      h('div', { class: 'cube-wrap' }, [bild.svg]),
      bild.leiste,
      status,
      h('div', { class: 'zeile' }, [zaehler, tempo]),
      chips,
      steuerung,
    ]);
    ausgabe();
    return karte;
  }

  /* ---------- Würfel zum Anschauen und freies Ausprobieren ---------- */
  function statischerWuerfel(ansicht) {
    var b = wuerfelBild(ansicht, W.neu());
    return h('div', { class: 'demo' }, [h('div', { class: 'cube-wrap' }, [b.svg]), b.leiste]);
  }

  function ausprobieren() {
    var state = W.neu(), warteschlange = [], laeuft = false, protokoll = [];
    var bild = wuerfelBild('oben', state);
    var log = h('p', { class: 'status', 'aria-live': 'polite', text: 'Noch keine Drehung.' });
    function melde() {
      log.textContent = 'Deine Drehungen: ' + protokoll.slice(-24).join(' ') + (W.geloest(state) ? ' – gelöst!' : '');
    }
    function naechste() {
      if (laeuft || !warteschlange.length) return;
      laeuft = true;
      var z = warteschlange.shift();
      var p = animParam(z, 1), d = dauer(), t0 = null;
      function ende() {
        W.zug(state, z); bild.zeige(state); laeuft = false;
        protokoll.push(z); melde();
        naechste();
      }
      if (d === 0) { ende(); return; }
      (function tick(zeit) {
        if (t0 === null) t0 = zeit;
        var t = Math.min(1, (zeit - t0) / (d * (p.viertel === 2 ? 0.8 : 0.55)));
        bild.zeige(state, { zug: z, viertel: p.viertel, winkel: t, richtung: p.richtung });
        if (t < 1) requestAnimationFrame(tick); else ende();
      })(performance.now());
    }
    function dreh(z) { warteschlange.push(z); naechste(); }
    var gitter = h('div', { class: 'tasten' });
    ['U', 'D', 'F', 'B', 'R', 'L'].forEach(function (f) {
      [f, f + "'", f + '2'].forEach(function (z) {
        gitter.appendChild(h('button', { type: 'button', class: 'btn taste', text: z, onclick: function () { dreh(z); }, 'aria-label': 'Drehung ' + z }));
      });
    });
    var reset = h('button', { type: 'button', class: 'btn', text: 'Zurücksetzen', onclick: function () {
      warteschlange = []; protokoll = []; state = W.neu(); bild.zeige(state); log.textContent = 'Alles gelöst. Noch keine Drehung.';
    } });
    var misch = h('button', { type: 'button', class: 'btn', text: 'Mischen', onclick: function () {
      warteschlange = []; var fl = 'UDFBRL', zs = [];
      for (var i = 0; i < 20; i++) { var z = fl.charAt(Math.floor(Math.random() * 6)); zs.push(z + ['', "'", '2'][Math.floor(Math.random() * 3)]); }
      W.wende(state, zs.join(' ')); protokoll = []; bild.zeige(state); log.textContent = 'Gemischt. Kannst du ihn lösen?';
    } });
    return h('div', { class: 'demo' }, [
      h('div', { class: 'cube-wrap' }, [bild.svg]), bild.leiste, log, gitter, h('div', { class: 'controls' }, [reset, misch]),
    ]);
  }

  /* ---------- Seiten ---------- */
  function abschnitt(a) {
    var sec = h('section', { class: 'abschnitt' });
    if (a.titel) sec.appendChild(h('h3', { text: a.titel }));
    (a.absaetze || []).forEach(function (t) { sec.appendChild(absatz(t)); });
    if (a.schritte) {
      var ol = h('ol', { class: 'schritte' });
      a.schritte.forEach(function (t) { var li = h('li'); li.appendChild(format(t)); ol.appendChild(li); });
      sec.appendChild(ol);
    }
    if (a.typ === 'wuerfel') sec.appendChild(statischerWuerfel(a.ansicht));
    if (a.typ === 'ausprobieren') sec.appendChild(ausprobieren());
    if (a.demo) sec.appendChild(demoPlayer(a.demo));
    if (a.merke) { var m = h('aside', { class: 'merke' }); m.appendChild(h('strong', { text: 'Merke: ' })); m.appendChild(format(a.merke)); sec.appendChild(m); }
    return sec;
  }

  function uebersicht() {
    var erledigt = laden();
    var anzahl = LEKTIONEN.filter(function (l) { return erledigt[l.id]; }).length;
    var seite = h('div', {}, [
      h('h1', { text: 'Zauberwürfel lernen' }),
      h('p', { class: 'einleitung', text: 'Schritt für Schritt zum gelösten Würfel. Zu jeder Zugfolge siehst du, was sie tut, und kannst sie Zug für Zug nachspielen. Teil 1 bringt dich zum ersten gelösten Würfel. In Teil 2 lernst du Zugfolgen, mit denen du schneller wirst.' }),
      h('p', { class: 'fortschritt', 'data-testid': 'fortschritt', text: anzahl + ' von ' + LEKTIONEN.length + ' Lektionen erledigt' }),
    ]);
    [[1, 'Teil 1: Den Würfel lösen lernen'], [2, 'Teil 2: Schneller werden']].forEach(function (teil) {
      seite.appendChild(h('h2', { text: teil[1] }));
      var liste = h('ol', { class: 'liste', start: String(LEKTIONEN.indexOf(LEKTIONEN.filter(function (l) { return l.teil === teil[0]; })[0]) + 1) });
      LEKTIONEN.forEach(function (l, i) {
        if (l.teil !== teil[0]) return;
        var a = h('a', { href: '#/lektion/' + l.id, class: 'karte' }, [
          h('span', { class: 'nr', text: String(i + 1) }),
          h('span', { class: 'karte-text' }, [h('strong', { text: l.titel }), h('span', { text: l.ziel })]),
          h('span', { class: 'haken', text: erledigt[l.id] ? '✓' : '', 'aria-label': erledigt[l.id] ? 'erledigt' : '' }),
        ]);
        liste.appendChild(h('li', {}, [a]));
      });
      seite.appendChild(liste);
    });
    return seite;
  }

  function lektion(l) {
    var i = LEKTIONEN.indexOf(l), erledigt = laden();
    var seite = h('div', {}, [
      h('a', { href: '#/', class: 'zurueck', text: '← Alle Lektionen' }),
      h('p', { class: 'kicker', text: 'Lektion ' + (i + 1) + ' von ' + LEKTIONEN.length + ' · Teil ' + l.teil }),
      h('h1', { text: l.titel }),
      h('p', { class: 'ziel' }, [h('strong', { text: 'Ziel: ' }), l.ziel]),
    ]);
    l.abschnitte.forEach(function (a) { seite.appendChild(abschnitt(a)); });
    var tog = h('button', { type: 'button', class: 'btn toggle', 'data-testid': 'erledigt' });
    function zeigeToggle() { var e = laden()[l.id]; tog.setAttribute('aria-pressed', String(!!e)); tog.textContent = e ? '✓ Erledigt' : 'Als erledigt markieren'; }
    tog.addEventListener('click', function () { var e = laden(); if (e[l.id]) delete e[l.id]; else e[l.id] = true; speichern(e); zeigeToggle(); });
    zeigeToggle();
    var nav = h('nav', { class: 'fuss', 'aria-label': 'Lektionen' }, [tog]);
    var davor = LEKTIONEN[i - 1], danach = LEKTIONEN[i + 1];
    var zeile = h('div', { class: 'blaettern' });
    if (davor) zeile.appendChild(h('a', { href: '#/lektion/' + davor.id, class: 'btn', text: '← ' + davor.titel }));
    if (danach) zeile.appendChild(h('a', { href: '#/lektion/' + danach.id, class: 'btn primary', text: 'Weiter: ' + danach.titel + ' →' }));
    else zeile.appendChild(h('a', { href: '#/', class: 'btn primary', text: 'Zurück zur Übersicht' }));
    nav.appendChild(zeile);
    seite.appendChild(nav);
    return seite;
  }

  function nichtGefunden() {
    return h('div', {}, [h('h1', { text: 'Diese Seite gibt es nicht' }), h('a', { href: '#/', class: 'btn primary', text: 'Zur Übersicht' })]);
  }

  var laufende = [];
  function route() {
    var m = /^#\/lektion\/([a-z0-9-]+)$/.exec(location.hash);
    var seite;
    if (!location.hash || location.hash === '#/' || location.hash === '#') seite = uebersicht();
    else if (m) { var l = LEKTIONEN.filter(function (x) { return x.id === m[1]; })[0]; seite = l ? lektion(l) : nichtGefunden(); document.title = (l ? l.titel + ' – ' : '') + 'Zauberwürfel lernen'; }
    else seite = nichtGefunden();
    if (!m) document.title = 'Zauberwürfel lernen';
    wurzel.textContent = '';
    wurzel.appendChild(seite);
    window.scrollTo(0, 0);
    var kopf = wurzel.querySelector('h1'); if (kopf) { kopf.setAttribute('tabindex', '-1'); }
  }
  window.addEventListener('hashchange', route);
  route();
})();
