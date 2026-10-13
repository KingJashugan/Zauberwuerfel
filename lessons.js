/* Inhalte der Lernseite. Alle Texte sind Deutsch.
 * Aufbau einer Lektion: { id, teil, titel, ziel, abschnitte: [...] }
 * Ein Abschnitt hat optional: titel, absaetze (Liste von Texten), schritte (nummerierte Liste),
 * merke (Merkkasten), demo (spielbare Demo), typ ('wuerfel' = Bild, 'ausprobieren' = freie Drehungen).
 * Eine Demo startet standardmäßig mit dem Würfel, aus dem die Zugfolge wieder einen gelösten Würfel macht
 * (also mit der Umkehrung der Zugfolge). Alle Demos prüft test.mjs.
 * Textauszeichnung: **fett**, `Zugfolge`. */
(function (root) {
  'use strict';

  /* n Durchgänge einer Zugfolge; der erste wird in Einzelzüge mit Erklärung zerlegt. */
  function durchgaenge(zuege, n, einzel, spaeter) {
    var teile = zuege.split(' ');
    var aus = teile.map(function (z, i) { return { zuege: z, text: einzel[i] }; });
    for (var k = 2; k <= n; k++) aus.push({ zuege: zuege, text: spaeter + ' (Durchgang ' + k + ' von ' + n + ')' });
    return aus;
  }

  var SEXY = ["R", "U", "R'", "U'"];
  var SEXY_TEXTE = [
    'R: Die rechte Spalte dreht nach oben.',
    'U: Die obere Schicht dreht und schiebt die Teile aus dem Weg.',
    "R': Die rechte Spalte dreht zurück. Dabei kommt eine Ecke an anderer Stelle und anders gedreht an.",
    "U': Die obere Schicht dreht zurück. Eine Wiederholung ist fertig.",
  ];
  var SEXY_SPAETER = 'Noch einmal R U R\' U\'. Mit jeder Wiederholung dreht die Ecke ein Stück weiter';

  var L = [];

  /* ---------------------------------------------------------------- Teil 1 */
  L.push({
    id: 'kennenlernen', teil: 1, titel: 'Den Würfel kennenlernen',
    ziel: 'Du weißt, woraus der Würfel besteht, wie die Farben liegen und was die Buchstaben R, L, U, D, F, B bedeuten.',
    abschnitte: [
      {
        titel: 'Woraus der Würfel besteht',
        absaetze: [
          'Ein Zauberwürfel hat 26 sichtbare Steine. Es gibt nur drei Sorten:',
        ],
        schritte: [
          '**6 Mittelsteine** mit einer Farbe. Sie sitzen fest in der Mitte jeder Seite und wandern nie. Sie bestimmen die Farbe ihrer Seite.',
          '**12 Kantensteine** mit zwei Farben. Sie sitzen zwischen zwei Mittelsteinen.',
          '**8 Eckensteine** mit drei Farben. Sie sitzen in den Ecken.',
        ],
        typ: 'wuerfel', ansicht: 'oben',
        merke: 'Weil die Mittelsteine fest sind, kannst du den Würfel nie "falsch herum" lösen: Du baust jede Seite um ihren Mittelstein herum.',
      },
      {
        titel: 'Die Farben',
        absaetze: [
          'Auf dieser Seite hältst du den Würfel immer gleich: **Weiß unten**, **Gelb oben**, **Grün vorne**. Dann liegt **Orange rechts**, **Rot links** und **Blau hinten**.',
          'Der Würfel im Bild lässt sich mit den Knöpfen "Von oben", "Von unten" und "Flach" ansehen. Bei "Flach" siehst du die gelbe Oberseite von oben, mit den Farben der Seitenstreifen am Rand.',
        ],
        merke: 'Hat dein Würfel ein anderes Farbschema, funktionieren alle Schritte trotzdem. Nur die Farbnamen in den Texten weichen dann ab.',
      },
      {
        titel: 'Die Drehungen',
        absaetze: [
          'Jede Drehung hat einen Buchstaben für die Seite, die gedreht wird:',
        ],
        schritte: [
          '**R** = rechts, **L** = links, **U** = oben (up), **D** = unten (down), **F** = vorne (front), **B** = hinten (back).',
          'Ein Buchstabe allein heißt: ein Viertel im **Uhrzeigersinn**, wenn du direkt auf diese Seite schaust.',
          'Ein **Strich** (zum Beispiel `R'+"'"+'`) heißt: ein Viertel **gegen** den Uhrzeigersinn.',
          'Eine **2** (zum Beispiel `R2`) heißt: eine halbe Drehung. Die Richtung ist egal.',
        ],
        merke: 'Probiere es gleich aus. Drücke unten die Knöpfe und sieh nach, was passiert. Mit "Zurücksetzen" ist alles wieder gelöst.',
      },
      { titel: 'Ausprobieren', typ: 'ausprobieren', absaetze: ['Dreh frei herum. Du kannst nichts kaputt machen.'] },
    ],
  });

  L.push({
    id: 'kreuz', teil: 1, titel: 'Das weiße Kreuz',
    ziel: 'Auf der weißen Seite liegen vier weiße Kanten, und jede passt zur Mitte der Seitenfläche daneben.',
    abschnitte: [
      {
        titel: 'Was du erreichen willst',
        absaetze: [
          'Du baust ein Kreuz aus den vier weißen Kanten um den weißen Mittelstein. Das Kreuz liegt **unten**. Halte dafür den Würfel mit Weiß nach unten.',
          'Das Kreuz ist erst richtig, wenn auch die zweite Farbe jeder Kante zur Seite passt: Die weiß-grüne Kante gehört unter die grüne Mitte, die weiß-orange unter die orange Mitte und so weiter.',
          'Dieser Schritt hat **keine feste Zugfolge**. Du denkst mit. Die drei Beispiele unten decken fast alle Fälle ab. Jedes Beispiel zeigt eine Kante in einer anderen Lage, hier die weiß-grüne.',
        ],
        typ: 'wuerfel', ansicht: 'unten',
      },
      {
        titel: 'Fall 1: Weiß zeigt nach oben',
        absaetze: ['Dreh die obere Schicht (U), bis die Kante genau über ihrem Platz liegt: Ihre grüne Seite zeigt auf die grüne Mitte. Dann reicht eine halbe Drehung der Vorderseite.'],
        demo: {
          titel: 'Weiß oben, Kante über ihrem Platz', ansicht: 'unten',
          vorher: 'Die weiß-grüne Kante liegt oben vorne. Das Weiß zeigt nach oben, das Grün nach vorne.',
          nachher: 'Die Kante sitzt unten vorne. Das Kreuz hat ein Teil mehr.',
          gruppen: [{ zuege: 'F2', text: 'F2: Die Vorderseite dreht halb herum. Die Kante fällt von oben nach unten, das Weiß zeigt jetzt nach unten.' }],
        },
      },
      {
        titel: 'Fall 2: Weiß zeigt zur Seite',
        absaetze: [
          'Liegt die Kante in der oberen Schicht und das Weiß zeigt zur Seite, drehst du U, bis sie **rechts oben** liegt. Dann hilft eine Dreierfolge.',
          'Liegt sie woanders, dreh sie mit U erst an diese Stelle. Gehört sie nicht nach vorne, dreh den ganzen Würfel, bis ihr Platz vorne liegt.',
        ],
        demo: {
          titel: 'Weiß zeigt nach rechts, Kante oben rechts', ansicht: 'unten',
          vorher: 'Die weiß-grüne Kante liegt oben rechts. Das Weiß zeigt nach rechts, das Grün nach oben.',
          nachher: 'Die Kante sitzt unten vorne an ihrem Platz, richtig herum. Der Rest ist unverändert.',
          gruppen: [
            { zuege: "R'", text: "R': Die rechte Spalte dreht nach vorne. Die Kante rutscht in die mittlere Schicht, vorne rechts." },
            { zuege: 'F', text: 'F: Die Vorderseite dreht eine Viertelumdrehung. Die Kante fällt nach unten vorne, richtig herum.' },
            { zuege: 'R', text: 'R: Die rechte Spalte dreht zurück. Alles, was R\' bewegt hat, sitzt wieder, wo es war.' },
          ],
        },
      },
      {
        titel: 'Fall 3: Die Kante steckt in der Mitte',
        absaetze: ['Steckt die Kante in der mittleren Schicht, zum Beispiel vorne rechts, reicht oft ein einziger Zug, wenn das Weiß zur richtigen Seite zeigt.'],
        demo: {
          titel: 'Kante vorne rechts in der Mitte', ansicht: 'unten',
          vorher: 'Die weiß-grüne Kante steckt in der mittleren Schicht, vorne rechts. Das Weiß zeigt nach rechts.',
          nachher: 'Die Kante sitzt unten vorne, richtig herum.',
          gruppen: [{ zuege: 'F', text: 'F: Die Vorderseite dreht im Uhrzeigersinn. Die Kante geht von rechts nach unten und das Weiß zeigt nach unten.' }],
        },
        merke: 'Steckt die Kante falsch, dreh sie zuerst mit einem Zug aus ihrem Platz nach oben und gehe dann zu Fall 1 oder 2. Wiederhole das für alle vier Kanten. Prüfe zum Schluss, ob jede Kante zur Seitenfarbe passt.',
      },
    ],
  });

  L.push({
    id: 'ecken', teil: 1, titel: 'Die weißen Ecken',
    ziel: 'Die ganze untere Schicht ist fertig: das Kreuz und die vier weißen Ecken.',
    abschnitte: [
      {
        titel: 'Der Sexy Move',
        absaetze: [
          'Du lernst deine erste Zugfolge: `R U R\' U\'`, genannt **Sexy Move**. Sie hat nur vier Züge und taucht später immer wieder auf.',
          'Wiederholst du sie sechsmal, ist der Würfel wieder wie vorher. Dazwischen wandert eine Ecke durch alle drei möglichen Lagen. So bringst du sie an ihren Platz.',
        ],
        typ: 'wuerfel', ansicht: 'unten',
      },
      {
        titel: 'So gehst du vor',
        schritte: [
          'Suche in der oberen Schicht eine Ecke mit Weiß.',
          'Dreh U, bis die Ecke **oben rechts vorne** liegt. Ihre beiden anderen Farben müssen zu den Mitten vorne und rechts passen, also genau über ihrem Platz.',
          'Schau, wohin das Weiß zeigt, und wiederhole den Sexy Move: **Weiß nach rechts: 1-mal. Weiß nach oben: 3-mal. Weiß nach vorne: 5-mal.**',
          'Wiederhole das für alle vier Ecken. Dreh den ganzen Würfel, damit der gewünschte Platz vorne rechts liegt.',
        ],
      },
      {
        titel: 'Weiß zeigt nach rechts: 1-mal',
        demo: {
          titel: 'Weiß nach rechts', ansicht: 'unten',
          vorher: 'Die Ecke steht oben rechts vorne, das Weiß zeigt nach rechts. Ein paar Teile in der oberen Schicht sind auch verschoben.',
          nachher: 'Die Ecke sitzt unten vorne rechts, Weiß zeigt nach unten. Alles ist wieder an seinem Platz.',
          gruppen: durchgaenge("R U R' U'", 1, SEXY_TEXTE, SEXY_SPAETER),
        },
      },
      {
        titel: 'Weiß zeigt nach oben: 3-mal',
        demo: {
          titel: 'Weiß nach oben', ansicht: 'unten',
          vorher: 'Die Ecke steht oben rechts vorne, das Weiß zeigt nach oben.',
          nachher: 'Nach 3 Wiederholungen sitzt die Ecke richtig.',
          gruppen: durchgaenge("R U R' U'", 3, SEXY_TEXTE, SEXY_SPAETER),
        },
      },
      {
        titel: 'Weiß zeigt nach vorne: 5-mal',
        demo: {
          titel: 'Weiß nach vorne', ansicht: 'unten',
          vorher: 'Die Ecke steht oben rechts vorne, das Weiß zeigt nach vorne.',
          nachher: 'Nach 5 Wiederholungen sitzt die Ecke richtig.',
          gruppen: durchgaenge("R U R' U'", 5, SEXY_TEXTE, SEXY_SPAETER),
        },
        merke: 'Zählen musst du nicht auswendig lernen: Wiederhole den Sexy Move einfach, bis die Ecke unten richtig sitzt. Das sind nie mehr als fünf Wiederholungen.',
      },
      {
        titel: 'Die Ecke sitzt unten, aber falsch gedreht',
        absaetze: ['Steckt eine weiße Ecke unten an ihrem Platz, aber das Weiß zeigt zur Seite? Dann wiederhole denselben Sexy Move, bis sie richtig sitzt: bei Weiß nach rechts 2-mal, bei Weiß nach vorne 4-mal.'],
        demo: {
          titel: 'Unten falsch gedreht', ansicht: 'unten',
          vorher: 'Die Ecke steckt unten vorne rechts, das Weiß zeigt nach rechts.',
          nachher: 'Nach 2 Wiederholungen sitzt sie richtig.',
          start: W_start_ecke_falsch(),
          gruppen: durchgaenge("R U R' U'", 2, SEXY_TEXTE, SEXY_SPAETER),
        },
      },
    ],
  });

  /* Hilfsfunktion für den Startzustand "Ecke unten falsch gedreht": Umkehrung von 2 Sexy Moves.
   * (Als Funktionsdeklaration, damit sie oben benutzt werden kann.) */
  function W_start_ecke_falsch() { return "(U R U' R')2"; }

  L.push({
    id: 'mitte', teil: 1, titel: 'Die mittlere Schicht',
    ziel: 'Die vier Kanten der mittleren Schicht sitzen an ihrem Platz. Zwei Schichten sind fertig.',
    abschnitte: [
      {
        titel: 'Würfel umdrehen',
        absaetze: ['Dreh den Würfel auf den Kopf: Weiß ist jetzt **unten** und Gelb **oben**. Du suchst nun Kanten ohne Gelb, die in die Lücken der mittleren Schicht gehören.'],
      },
      {
        titel: 'So gehst du vor',
        schritte: [
          'Suche oben eine Kante, die **kein Gelb** hat. Kanten mit Gelb gehören nicht in die Mitte.',
          'Dreh U, bis die **vordere** Farbe der Kante zur Mitte vorne passt.',
          'Schau auf die **obere** Farbe der Kante. Passt sie zur Mitte **rechts**, nimm die Folge nach rechts. Passt sie zur Mitte **links**, nimm die Spiegelfolge.',
        ],
      },
      {
        titel: 'Die Kante gehört nach rechts',
        demo: {
          titel: 'Kante nach rechts', ansicht: 'oben',
          vorher: 'Die Kante liegt oben vorne. Die vordere Farbe passt zur vorderen Mitte, die obere zur Mitte rechts.',
          nachher: 'Die Kante sitzt in der mittleren Schicht vorne rechts. Die untere Schicht ist wieder komplett.',
          gruppen: [
            { zuege: "U R U' R'", text: 'Die ersten vier Züge machen vorne rechts einen Platz frei und ziehen die Kante an die richtige Stelle. Die untere Schicht geht kurz auseinander.' },
            { zuege: "U' F' U F", text: 'Die nächsten vier Züge setzen die Kante in die Lücke ein. Danach ist die untere Schicht wieder komplett.' },
          ],
        },
      },
      {
        titel: 'Die Kante gehört nach links',
        absaetze: ['Alles gespiegelt: Statt R nimmst du L, und jede Richtung dreht sich um.'],
        demo: {
          titel: 'Kante nach links', ansicht: 'oben',
          vorher: 'Die Kante liegt oben vorne. Die vordere Farbe passt zur vorderen Mitte, die obere zur Mitte links.',
          nachher: 'Die Kante sitzt in der mittleren Schicht vorne links.',
          gruppen: [
            { zuege: "U' L' U L", text: 'Das Spiegelbild der ersten vier Züge: Es macht vorne links Platz.' },
            { zuege: "U F U' F'", text: 'Das Spiegelbild der zweiten vier Züge: Es setzt die Kante vorne links ein.' },
          ],
        },
      },
      {
        titel: 'Wenn eine Kante falsch steckt',
        absaetze: [
          'Steckt in der mittleren Schicht schon eine Kante am falschen Platz, oder mit falscher Ausrichtung, hole sie heraus: Wende die Folge nach rechts einmal an, auch wenn die Kante dort nicht hingehört. Sie wandert nach oben und du setzt sie von dort richtig ein.',
        ],
        merke: 'Im Zweifel: Folge nach rechts oder links einmal anwenden, schauen, neu entscheiden.',
      },
    ],
  });

  L.push({
    id: 'gelbes-kreuz', teil: 1, titel: 'Das gelbe Kreuz',
    ziel: 'Oben liegt ein gelbes Kreuz. Die vier Kanten der gelben Schicht zeigen mit Gelb nach oben. Die Seitenfarben müssen noch nicht passen.',
    abschnitte: [
      {
        titel: 'Drei mögliche Bilder',
        absaetze: [
          'Schau von oben auf die gelbe Seite. Du siehst eines von drei Bildern: einen **Punkt** (kein gelbes Kantenstück oben), eine **Linie** (zwei gegenüber) oder ein **L** (zwei nebeneinander). Ein Kreuz ist schon fertig.',
          'Alle drei Fälle löst dieselbe Zugfolge: `F R U R\' U\' F\'`. Du wendest sie bis zu dreimal an.',
        ],
        merke: 'Wähle die Ansicht "Flach", um die Oberseite so zu sehen, wie du sie auch am echten Würfel siehst.',
      },
      {
        titel: 'Linie waagerecht: 1-mal',
        absaetze: ['Halte den Würfel so, dass die Linie **waagerecht** liegt, von links nach rechts.'],
        demo: {
          titel: 'Linie', ansicht: 'flach',
          vorher: 'Zwei gelbe Kanten liegen links und rechts. Vorne und hinten fehlen.',
          nachher: 'Alle vier gelben Kanten zeigen nach oben: das Kreuz.',
          gruppen: [
            { zuege: 'F', text: 'F: Die Vorderseite dreht und nimmt die vordere Kante mit.' },
            { zuege: "R U R' U'", text: 'Der Sexy Move kehrt zwei Kanten der gelben Schicht um.' },
            { zuege: "F'", text: "F': Die Vorderseite dreht zurück. Das Kreuz ist fertig." },
          ],
        },
      },
      {
        titel: 'L: 2-mal',
        absaetze: ['Halte den Würfel so, dass das L nach **hinten und links** zeigt, also ein Eck oben links. Wende die Zugfolge zweimal an. Nach dem ersten Mal siehst du eine Linie.'],
        demo: {
          titel: 'L-Form', ansicht: 'flach',
          vorher: 'Zwei gelbe Kanten liegen hinten und links und bilden ein L.',
          nachher: 'Nach zwei Durchgängen ist das Kreuz fertig.',
          start: invertiereJetzt("F R U R' U' F' F R U R' U' F'"),
          gruppen: [
            { zuege: "F R U R' U' F'", text: 'Erster Durchgang: aus dem L wird eine Linie.' },
            { zuege: "F R U R' U' F'", text: 'Zweiter Durchgang: aus der Linie wird das Kreuz.' },
          ],
        },
      },
      {
        titel: 'Punkt: 3-mal',
        absaetze: ['Beim Punkt wendest du die Folge einmal an und bekommst ein L. Dreh die obere Schicht (U), bis das L nach hinten und links zeigt, und mache dann wie beim L weiter.'],
        demo: {
          titel: 'Punkt', ansicht: 'flach',
          vorher: 'Keine gelbe Kante liegt oben. Nur der gelbe Mittelstein ist zu sehen.',
          nachher: 'Nach drei Durchgängen ist das Kreuz fertig.',
          start: invertiereJetzt("F R U R' U' F' U2 F R U R' U' F' F R U R' U' F'"),
          gruppen: [
            { zuege: "F R U R' U' F'", text: 'Erster Durchgang: aus dem Punkt wird ein L.' },
            { zuege: 'U2', text: 'U2: Dreh die obere Schicht, bis das L nach hinten und links zeigt.' },
            { zuege: "F R U R' U' F'", text: 'Zweiter Durchgang: aus dem L wird eine Linie.' },
            { zuege: "F R U R' U' F'", text: 'Dritter Durchgang: aus der Linie wird das Kreuz.' },
          ],
        },
      },
    ],
  });

  L.push({
    id: 'gelbe-kanten', teil: 1, titel: 'Gelbe Kanten an den richtigen Platz',
    ziel: 'Alle vier Kanten der gelben Schicht passen zu den Mitten ihrer Seiten.',
    abschnitte: [
      {
        titel: 'Was fehlt noch',
        absaetze: [
          'Die gelben Kanten zeigen schon nach oben, aber sie sitzen vielleicht am falschen Platz. Du erkennst das an der Seitenfarbe: Die grüne Seite der Kante muss vorne unter der grünen Mitte stehen.',
          'Die Zugfolge unten **tauscht die Kanten vorne und links**. Ecken wandern dabei auch, das macht erst der nächste Schritt wieder gut.',
        ],
      },
      {
        titel: 'So gehst du vor',
        schritte: [
          'Dreh U, bis möglichst viele Kanten zur Mitte darunter passen.',
          'Passen **alle vier**, bist du fertig.',
          'Passen **zwei nebeneinander**, halte den Würfel so, dass diese beiden **hinten und rechts** liegen, und wende die Folge einmal an.',
          'Sonst (nur eine passt, oder zwei liegen gegenüber): Wende die Folge einmal an, egal wie du den Würfel hältst. Dann schau neu bei Schritt 1.',
        ],
        merke: 'Nach jeder Anwendung beginnst du mit Schritt 1 von vorne. Mehr als vier Anwendungen brauchst du nie.',
      },
      {
        titel: 'Die Zugfolge',
        demo: {
          titel: 'Kanten vorne und links tauschen', ansicht: 'oben',
          vorher: 'Die Kanten vorne und links sind vertauscht. Hinten und rechts sitzen richtig. Drei Ecken sind auch verschoben; das ist hier egal.',
          nachher: 'Die beiden Kanten sind wieder an ihrem Platz, und die Ecken auch.',
          gruppen: [
            { zuege: "R U R'", text: "R U R': Die rechte Spalte klappt nach oben, die Oberseite dreht, die Spalte klappt zurück. Teile kommen an anderer Stelle an." },
            { zuege: 'U', text: 'U: Die obere Schicht dreht ein Stück weiter.' },
            { zuege: "R U2 R'", text: "R U2 R': Dasselbe noch einmal, mit einer halben Drehung oben." },
            { zuege: 'U', text: 'U: Zum Schluss dreht die obere Schicht noch einmal. Jetzt sitzen die beiden Kanten richtig.' },
          ],
        },
      },
    ],
  });

  L.push({
    id: 'gelbe-ecken-platz', teil: 1, titel: 'Gelbe Ecken an den richtigen Platz',
    ziel: 'Jede gelbe Ecke sitzt zwischen den richtigen Mitten. Gedreht sein dürfen sie noch.',
    abschnitte: [
      {
        titel: 'Woran du eine richtige Ecke erkennst',
        absaetze: [
          'Eine Ecke sitzt richtig, wenn ihre drei Farben zu den Mitten passen, an denen sie liegt. Die gelb-grün-orange Ecke gehört zwischen Grün und Orange, also oben vorne rechts. Wie sie gedreht ist, spielt hier noch keine Rolle.',
          'Die Zugfolge unten lässt die Ecke **vorne rechts** stehen und tauscht die drei anderen im Kreis. Die Kanten bleiben dabei, wo sie sind.',
        ],
      },
      {
        titel: 'So gehst du vor',
        schritte: [
          'Zähle, wie viele Ecken richtig sitzen. Sind es **alle vier**, geh zum nächsten Schritt.',
          'Sitzt **genau eine** richtig, halte den Würfel so, dass sie **vorne rechts oben** liegt. Wende die Folge an. Sitzen noch nicht alle richtig, wende sie ein zweites Mal an.',
          'Sitzt **keine** richtig, wende die Folge einmal an, egal wie du den Würfel hältst. Dann hast du eine richtige Ecke und machst mit Schritt 2 weiter.',
        ],
      },
      {
        titel: 'Die Zugfolge',
        demo: {
          titel: 'Drei Ecken im Kreis tauschen', ansicht: 'oben',
          vorher: 'Die Ecke vorne rechts sitzt richtig. Die anderen drei Ecken sind im Kreis verschoben.',
          nachher: 'Alle vier Ecken sitzen richtig.',
          gruppen: [
            { zuege: "U R U' L'", text: "Die ersten vier Züge heben die Ecken hinten und links aus ihren Plätzen." },
            { zuege: "U R' U' L", text: "Die letzten vier Züge setzen sie so wieder ein, dass die drei Ecken im Kreis wandern. Vorne rechts bleibt stehen." },
          ],
        },
      },
    ],
  });

  L.push({
    id: 'gelbe-ecken-drehen', teil: 1, titel: 'Gelbe Ecken drehen: geschafft!',
    ziel: 'Alle gelben Ecken zeigen mit Gelb nach oben. Der Würfel ist gelöst.',
    abschnitte: [
      {
        titel: 'Der letzte Schritt',
        absaetze: [
          'Die Ecken sitzen richtig, aber manche sind gedreht. Eine kurze Zugfolge dreht die Ecke **vorne rechts oben** auf der Stelle: `R\' D\' R D`. Du wiederholst sie, bis das Gelb nach oben zeigt.',
        ],
        merke: 'Wichtig: Während du eine Ecke drehst, sieht der Würfel unten durcheinander aus. Das ist richtig so! Brich nie mittendrin ab, sondern mache mit der nächsten Ecke weiter. Erst am Ende ist alles an seinem Platz.',
      },
      {
        titel: 'So gehst du vor',
        schritte: [
          'Halte den Würfel mit Gelb oben. Schau auf die Ecke **vorne rechts oben**.',
          'Wiederhole `R\' D\' R D`, bis dort das **Gelb nach oben** zeigt. Das ist nach 2 oder 4 Durchgängen der Fall. Zeigt Gelb schon nach oben, tust du nichts.',
          'Dreh nur die **obere Schicht** (U), bis die nächste Ecke vorne rechts steht. Dreh nicht den ganzen Würfel!',
          'Wiederhole das für alle vier Ecken. Zum Schluss dreh U, bis die Farben der Seiten übereinstimmen.',
        ],
      },
      {
        titel: 'Ein Beispiel mit zwei Ecken',
        demo: {
          titel: 'Zwei Ecken drehen', ansicht: 'oben',
          vorher: 'Zwei gelbe Ecken sind gedreht, die anderen beiden stimmen.',
          nachher: 'Alle vier Ecken zeigen nach oben. Der Würfel ist gelöst.',
          gruppen: [].concat(
            durchgaenge("R' D' R D", 2, [
              "R': Die rechte Spalte dreht nach vorne, die Ecke wandert nach unten.",
              "D': Die untere Schicht dreht. Hier sieht es kurz durcheinander aus – das ist normal.",
              'R: Die Ecke kommt wieder nach oben.',
              'D: Die untere Schicht dreht zurück. Ein Durchgang ist fertig.',
            ], "Noch einmal R' D' R D. Die Ecke dreht sich weiter"),
            [{ zuege: 'U', text: 'U: Die nächste Ecke kommt nach vorne rechts oben.' }],
            durchgaenge("R' D' R D", 4, ["R'", "D'", 'R', 'D'].map(function (z) { return z + ': Wie vorher.'; }), 'Weiter drehen'),
            [{ zuege: "U'", text: "U': Die obere Schicht dreht zurück. Alles passt." }]
          ),
        },
        merke: 'Geschafft! Wenn du bis hierhin gekommen bist, kannst du jeden Würfel lösen. Übe den Weg ein paar Mal. Im zweiten Teil lernst du Zugfolgen, mit denen du schneller wirst.',
      },
    ],
  });

  /* ---------------------------------------------------------------- Teil 2 */
  L.push({
    id: 'sune', teil: 2, titel: 'Sune: Ecken schneller drehen',
    ziel: 'Du drehst alle gelben Ecken mit einer kurzen Zugfolge nach oben, statt jede einzeln zu wiederholen.',
    abschnitte: [
      {
        titel: 'Warum noch eine Folge?',
        absaetze: [
          'Den Eckendreher aus Teil 1 musst du oft wiederholen. Die **Sune** (`R U R\' U R U2 R\'`) ist kürzer und dreht gleich mehrere Ecken in einem Rutsch. Sie ist eine der bekanntesten Zugfolgen überhaupt.',
          'Ändere die Reihenfolge: Erst alle Kanten nach oben (gelbes Kreuz), dann die Ecken mit der Sune nach oben drehen, dann alles an den richtigen Platz. Das ist die Idee der sogenannten **2-Look**-Methode.',
        ],
      },
      {
        titel: 'Wann Sune?',
        absaetze: [
          'Du hast das gelbe Kreuz und **genau eine gelbe Ecke zeigt mit Gelb nach oben**. Halte den Würfel so, dass diese Ecke **vorne links** liegt. Die anderen drei Ecken zeigen ihr Gelb zur Seite, wie im Bild. Dieses Bild heißt "Fisch".',
        ],
        demo: {
          titel: 'Sune', ansicht: 'flach',
          vorher: 'Das Kreuz ist fertig. Nur die Ecke vorne links hat Gelb oben, die anderen drei sind gedreht.',
          nachher: 'Alle vier Ecken zeigen nach oben. Zwischendurch wandern Kanten und Ecken; in der Demo ist am Ende alles wieder gelöst.',
          gruppen: [
            { zuege: "R U R'", text: "R U R': Die rechte Spalte klappt hoch und zurück, die Oberseite dreht dazwischen. Die Ecke vorne rechts kommt gedreht an." },
            { zuege: 'U', text: 'U: Die Oberseite dreht eine Viertelumdrehung.' },
            { zuege: "R U2 R'", text: "R U2 R': Das Gleiche mit einer halben Drehung oben. Danach zeigen alle vier Ecken nach oben." },
          ],
        },
        merke: 'Sieht deine Oberseite anders aus, wendest du die Sune an, bis es passt, oder du hältst den Würfel anders. Für die übrigen Bilder gibt es weitere Zugfolgen; sie heißen OLL. Sune ist die wichtigste.',
      },
    ],
  });

  L.push({
    id: 't-perm', teil: 2, titel: 'T-Perm: zwei Ecken und zwei Kanten tauschen',
    ziel: 'Du tauschst zwei Ecken und zwei Kanten in einem Zug, ohne die untere Hälfte zu stören.',
    abschnitte: [
      {
        titel: 'Was sie tut',
        absaetze: [
          'Die **T-Perm** vertauscht die **Kanten rechts und links** und die **beiden Ecken auf der rechten Seite**. Alles andere bleibt, wo es ist, und alle gelben Aufkleber zeigen weiter nach oben.',
          'Sie hilft zum Beispiel, wenn nach der Sune zwei Ecken nebeneinander und die Kanten zwischen ihnen vertauscht sind. Halte den Würfel so, dass die vertauschten Ecken auf der **rechten** Seite liegen.',
        ],
        demo: {
          titel: 'T-Perm', ansicht: 'oben',
          vorher: 'Die Kanten rechts und links sind vertauscht, ebenso die beiden Ecken auf der rechten Seite.',
          nachher: 'Alle Teile sitzen wieder richtig.',
          gruppen: [
            { zuege: "R U R' U'", text: 'Der Sexy Move. Du kennst ihn aus Teil 1.' },
            { zuege: "R' F R2 U' R'", text: 'Ein Teil bringt die Vorderseite ins Spiel: Es holt die Ecken vorne rechts und hinten rechts in Bewegung.' },
            { zuege: "U' R U R' F'", text: 'Der letzte Teil dreht alles zurück, bis auf zwei Ecken und zwei Kanten, die getauscht bleiben.' },
          ],
        },
        merke: 'Die T-Perm ist ihre eigene Umkehrung: Zweimal hintereinander angewendet, macht sie nichts.',
      },
    ],
  });

  L.push({
    id: 'y-perm', teil: 2, titel: 'Y-Perm: zwei Ecken diagonal tauschen',
    ziel: 'Du tauschst zwei gegenüberliegende Ecken, zusammen mit zwei Kanten.',
    abschnitte: [
      {
        titel: 'Was sie tut',
        absaetze: [
          'Die **Y-Perm** tauscht die Ecken **vorne rechts und hinten links** (diagonal gegenüber) und die Kanten **hinten und links**. Alles andere bleibt, und alle gelben Aufkleber zeigen weiter nach oben.',
          'Zusammen mit der T-Perm kannst du so die Ecken und Kanten der gelben Schicht ordnen: Liegen zwei **benachbarte** Ecken falsch, nimmst du die T-Perm, liegen zwei **diagonale** Ecken falsch, die Y-Perm.',
        ],
        demo: {
          titel: 'Y-Perm', ansicht: 'oben',
          vorher: 'Die Ecken vorne rechts und hinten links sind vertauscht, ebenso die Kanten hinten und links.',
          nachher: 'Alle Teile sitzen wieder richtig.',
          gruppen: [
            { zuege: "F R U' R' U' R U R' F'", text: 'Der erste Teil bringt die Ecken in Bewegung. Danach sieht die Oberseite durcheinander aus.' },
            { zuege: "R U R' U' R' F R F'", text: 'Der zweite Teil sortiert alles wieder, bis auf zwei Ecken und zwei Kanten, die getauscht bleiben.' },
          ],
        },
        merke: 'Mit Sune, T-Perm und Y-Perm löst du die gelbe Schicht auf eine zweite Art. Es gibt weitere Zugfolgen für noch schnellere Lösungen, aber diese drei sind ein guter Anfang.',
      },
    ],
  });

  /* Hilfsfunktion: invertiert eine Zugfolge (wird erst zur Laufzeit gebraucht). */
  function invertiereJetzt(text) {
    var Wf = typeof module !== 'undefined' && module.exports ? require('./cube.js') : root.Wuerfel;
    return Wf.invertiere(text);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.LEKTIONEN = L;
})(typeof window !== 'undefined' ? window : globalThis);
