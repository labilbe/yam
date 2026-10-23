// Vérification du moteur : règles unitaires, puis auto-parties jouées par l'IA.
import assert from 'node:assert/strict';
import { compter, suiteMax } from '../src/des.js';
import { Game, NB_TOURS } from '../src/game.js';
import { choisirCase, choisirGardes, valeurInscription } from '../src/ai.js';
import {
  CASES, CASES_BASSES, CASES_HAUTES, PRIME, PRIME_SEUIL,
  casesLibres, grilleComplete, grilleVide, primeEnJeu, scoreCase, totaux,
} from '../src/rules.js';

// ------------------------------------------------------------------- Dés

assert.deepEqual(compter([3, 3, 1, 6, 3]), [0, 1, 0, 3, 0, 0, 1]);
assert.equal(suiteMax(compter([1, 2, 3, 4, 6])), 4);
assert.equal(suiteMax(compter([2, 3, 4, 5, 6])), 5);
assert.equal(suiteMax(compter([1, 1, 2, 2, 5])), 2, 'les doublons n\'allongent pas la suite');

// ------------------------------------------------------------ Section haute

assert.equal(scoreCase('as', [1, 1, 1, 4, 5]), 3);
assert.equal(scoreCase('six', [6, 6, 1, 2, 6]), 18);
assert.equal(scoreCase('quatre', [1, 2, 3, 5, 6]), 0, 'aucun 4 : la case vaut zéro');

// ------------------------------------------------------------ Section basse

assert.equal(scoreCase('brelan', [3, 3, 3, 5, 1]), 15, 'le brelan vaut le total des cinq dés');
assert.equal(scoreCase('brelan', [3, 3, 2, 5, 1]), 0);
assert.equal(scoreCase('carre', [4, 4, 4, 4, 2]), 18);
assert.equal(scoreCase('carre', [4, 4, 4, 4, 4]), 20, 'cinq dés identiques contiennent un carré');
assert.equal(scoreCase('carre', [4, 4, 4, 2, 2]), 0);
assert.equal(scoreCase('full', [3, 3, 3, 5, 5]), 25);
assert.equal(scoreCase('full', [3, 3, 3, 5, 1]), 0, 'un brelan seul n\'est pas un full');
assert.equal(scoreCase('full', [2, 2, 2, 2, 2]), 0, 'un yam n\'est pas un full');
assert.equal(scoreCase('petiteSuite', [1, 2, 3, 4, 4]), 30);
assert.equal(scoreCase('petiteSuite', [3, 4, 5, 6, 6]), 30);
assert.equal(scoreCase('petiteSuite', [2, 3, 4, 6, 6]), 0, 'la suite est coupée après le 4');
assert.equal(scoreCase('grandeSuite', [1, 2, 3, 4, 5]), 40);
assert.equal(scoreCase('grandeSuite', [2, 3, 4, 5, 6]), 40);
assert.equal(scoreCase('grandeSuite', [1, 2, 3, 4, 6]), 0);
assert.equal(scoreCase('grandeSuite', [1, 2, 3, 4, 4]), 0, 'quatre dés qui se suivent ne suffisent pas');
assert.equal(scoreCase('yam', [5, 5, 5, 5, 5]), 50);
assert.equal(scoreCase('yam', [5, 5, 5, 5, 1]), 0);
assert.equal(scoreCase('chance', [6, 1, 4, 2, 3]), 16);

// --------------------------------------------------------- Totaux et prime

const grille = grilleVide();
assert.equal(casesLibres(grille).length, NB_TOURS);
assert.ok(primeEnJeu(grille));
for (const c of CASES_HAUTES) grille[c.id] = 3 * c.face; // Trois dés de chaque face : 63 pile.
assert.equal(totaux(grille).haute, PRIME_SEUIL);
assert.equal(totaux(grille).prime, PRIME, 'la prime tombe à 63 points pile');
assert.ok(!primeEnJeu(grille), 'prime acquise : elle ne pèse plus sur les choix');

const manquee = grilleVide();
for (const c of CASES_HAUTES) manquee[c.id] = 0;
assert.equal(totaux(manquee).prime, 0);
assert.ok(!primeEnJeu(manquee), 'section haute vide : la prime est hors d\'atteinte');

const entamee = grilleVide();
entamee.as = 0;
assert.ok(primeEnJeu(entamee), '63 reste atteignable sans les as');
entamee.six = 6;
entamee.cinq = 5;
assert.ok(!primeEnJeu(entamee), 'cinq et six bradés : 63 devient hors d\'atteinte');

// ------------------------------------------------------------- Évaluation

const neuve = grilleVide();
assert.ok(
  valeurInscription('yam', [5, 5, 5, 5, 5], neuve) > valeurInscription('cinq', [5, 5, 5, 5, 5], neuve),
  'un yam s\'inscrit en Yam’s, pas en Cinq',
);
assert.ok(
  valeurInscription('chance', [6, 5, 4, 3, 2], neuve) > valeurInscription('yam', [6, 5, 4, 3, 2], neuve),
  'on ne brade pas son Yam’s sur un lancer quelconque',
);
assert.equal(choisirCase([2, 3, 4, 5, 6], neuve), 'grandeSuite');
assert.equal(choisirCase([5, 5, 5, 5, 5], neuve), 'yam');
assert.deepEqual(
  choisirGardes([6, 6, 6, 6, 1], grilleVide(), 1, { tirages: 40 }),
  [true, true, true, true, false],
  'on garde le carré de 6 et on relance le dernier dé',
);
assert.deepEqual(
  choisirGardes([2, 2, 2, 2, 2], grilleVide(), 2, { tirages: 10 }),
  [true, true, true, true, true],
  'un yam ne se relance pas',
);

// --------------------------------------------------------- Déroulé du tour

const partie = new Game({ joueurs: ['A', 'B'] });
assert.equal(partie.des, null);
assert.ok(!partie.peutInscrire(), 'rien à inscrire avant le premier lancer');
assert.ok(!partie.basculerGarde(0), 'on ne garde pas un dé qui n\'est pas sorti');
assert.equal(partie.apercu('chance'), null);

partie.lancer();
assert.equal(partie.des.length, 5);
assert.ok(partie.peutInscrire(), 'on peut inscrire dès le premier lancer');
assert.ok(partie.basculerGarde(0));
assert.equal(partie.gardes[0], true);
const garde = partie.des[0];
partie.lancer();
assert.equal(partie.des[0], garde, 'un dé gardé ne bouge pas');
partie.lancer();
assert.equal(partie.lancers, 3);
assert.ok(!partie.peutLancer(), 'trois lancers par tour, pas un de plus');
assert.ok(!partie.lancer());
assert.ok(!partie.basculerGarde(1), 'plus de garde une fois le troisième lancer sorti');

assert.ok(partie.inscrire('chance'));
assert.ok(!partie.inscrire('chance'), 'une case ne se remplit qu\'une fois');
assert.equal(partie.joueur, 1, 'la main passe à l\'adversaire');
assert.equal(partie.lancers, 0);
assert.equal(partie.des, null, 'les dés sont rendus au joueur suivant');

// ------------------------------------------------------------ Auto-parties

const PARTIES = 120;
const TIRAGES = 12; // Suffisant pour juger du moteur ; l'interface en demande davantage.
const scores = [];
let primes = 0;
let yams = 0;
let tours = 0;

for (let n = 0; n < PARTIES; n++) {
  const g = new Game({ joueurs: ['A', 'B'] });
  while (g.phase !== 'fin') {
    const avant = casesLibres(g.grille).length;
    const joueur = g.joueur;

    g.lancer();
    assert.equal(g.lancers, 1);
    while (g.peutLancer()) {
      const gardes = choisirGardes(g.des, g.grille, g.lancersRestants(), { tirages: TIRAGES });
      if (gardes.every(Boolean)) break;
      g.definirGardes(gardes);
      g.lancer();
    }
    assert.ok(g.des.every((f) => f >= 1 && f <= 6), 'face de dé hors bornes');

    const id = choisirCase(g.des, g.grille);
    assert.ok(casesLibres(g.grille).includes(id), 'l\'IA vise une case déjà prise');
    const attendu = scoreCase(id, g.des);
    assert.ok(g.inscrire(id));
    assert.equal(g.grilles[joueur][id], attendu, 'score inscrit différent du score calculé');
    assert.equal(casesLibres(g.grilles[joueur]).length, avant - 1);
    tours++;
  }

  assert.equal(g.tour, NB_TOURS + 1, 'la partie doit durer treize tours');
  for (const feuille of g.grilles) {
    assert.ok(grilleComplete(feuille));
    const t = totaux(feuille);
    assert.equal(t.total, t.haute + t.prime + t.basse);
    assert.equal(t.prime, t.haute >= PRIME_SEUIL ? PRIME : 0);
    // Bornes dures : rien ne peut dépasser le maximum théorique de chaque case.
    for (const c of CASES_HAUTES) assert.ok(feuille[c.id] >= 0 && feuille[c.id] <= 5 * c.face);
    for (const c of CASES_BASSES) assert.ok(feuille[c.id] >= 0 && feuille[c.id] <= 50);
    scores.push(t.total);
    if (t.prime) primes++;
    if (feuille.yam > 0) yams++;
  }
  assert.ok(g.resultat.scores.every((s, j) => s === totaux(g.grilles[j]).total));
  const meilleur = Math.max(...g.resultat.scores);
  assert.equal(g.resultat.meilleur, meilleur);
  if (g.resultat.gagnant !== null) assert.equal(g.resultat.scores[g.resultat.gagnant], meilleur);
}

assert.equal(tours, PARTIES * NB_TOURS * 2, 'chaque joueur doit remplir ses treize cases');
const moyenne = scores.reduce((s, x) => s + x, 0) / scores.length;
const feuilles = scores.length;
// Avec aussi peu de simulations l'IA tourne autour de 195 points — l'interface,
// qui lui en accorde bien plus, la fait jouer une quinzaine de points au-dessus.
// En dessous de 170 de moyenne, ou avec une prime devenue anecdotique, c'est que
// le barème d'évaluation est cassé.
assert.ok(moyenne > 170 && moyenne < 260, `score moyen hors norme : ${moyenne.toFixed(1)}`);
assert.ok(primes / feuilles > 0.07, `prime trop rare : ${primes}/${feuilles}`);

console.log(`OK — ${PARTIES} parties, ${tours} tours joués.`);
console.log(`Score moyen : ${moyenne.toFixed(1)} (min ${Math.min(...scores)}, max ${Math.max(...scores)})`);
console.log(`Prime des 63 : ${((primes / feuilles) * 100).toFixed(0)} % — Yam's : ${((yams / feuilles) * 100).toFixed(0)} %`);
