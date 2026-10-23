// Adversaire : il choisit ses dés par simulation, puis sa case par valeur estimée.

import { NB_DES, compter, lancerDe, suiteMax } from './des.js';
import { CASE_PAR_ID, casesLibres, primeEnJeu, scoreCase } from './rules.js';

// Deux coefficients réglés par auto-parties (voir le README).
// En section haute, un point compte surtout pour la prime : l'écart avec les
// trois dés attendus — le minimum pour atteindre 63 — pèse bien plus que les
// points eux-mêmes.
const POIDS_PRIME = 6;
// Au-delà des trois dés attendus, les points supplémentaires ne servent plus
// qu'à couvrir une autre case haute : ils comptent, mais bien moins.
const POIDS_SURPLUS = 1;
// Ailleurs, une case rendue en dessous de son rendement de référence est en
// partie perdue : on retire le manque à gagner, sinon l'adversaire braderait sa
// Chance ou son Yam's au premier lancer médiocre venu.
const POIDS_GACHIS = 1;

/** Valeur d'une inscription : les points, la prime en vue, le gâchis en moins. */
export function valeurInscription(id, des, grille) {
  const info = CASE_PAR_ID.get(id);
  const points = scoreCase(id, des);
  // En section haute et tant que la prime se joue, c'est l'écart avec les trois
  // dés attendus qui compte — il vaut plus que les points eux-mêmes.
  if (info.section === 'haute' && primeEnJeu(grille)) {
    const ecart = points - info.attendu;
    return points + ecart * (ecart < 0 ? POIDS_PRIME : POIDS_SURPLUS);
  }
  return points - Math.max(0, info.attendu - points) * POIDS_GACHIS;
}

/** Ce que vaut un lancer : la meilleure inscription encore possible. */
function valeurLancer(des, grille) {
  let meilleure = -Infinity;
  for (const id of casesLibres(grille)) {
    const v = valeurInscription(id, des, grille);
    if (v > meilleure) meilleure = v;
  }
  return meilleure;
}

/** Case choisie en fin de tour : la mieux valorisée, les points départageant. */
export function choisirCase(des, grille) {
  const libres = casesLibres(grille);
  let choix = libres[0];
  let meilleure = -Infinity;
  let points = -Infinity;
  for (const id of libres) {
    const v = valeurInscription(id, des, grille);
    const p = scoreCase(id, des);
    if (v > meilleure || (v === meilleure && p > points)) {
      choix = id;
      meilleure = v;
      points = p;
    }
  }
  return choix;
}

/**
 * Garde expédiée, utilisée à l'intérieur des simulations : on conserve la suite
 * amorcée si elle vaut encore quelque chose, sinon le plus gros paquet de dés
 * identiques. Rechercher à nouveau la meilleure garde coûterait bien trop cher.
 */
export function gardesRapides(des, grille) {
  const compte = compter(des);
  const suites = grille.petiteSuite === null || grille.grandeSuite === null;
  if (suites && suiteMax(compte) >= 3) {
    const vus = new Set();
    // Un seul exemplaire de chaque face : les doublons repartent au lancer.
    return des.map((face) => {
      if (vus.has(face)) return false;
      vus.add(face);
      return true;
    });
  }
  let faceGardee = 0;
  for (let face = 1; face <= 6; face++) {
    if (compte[face] >= compte[faceGardee || 1] && compte[face] > 1) faceGardee = face;
  }
  if (!faceGardee) return des.map(() => false);
  return des.map((face) => face === faceGardee);
}

/** Une relance simulée jusqu'au bout du tour, puis la meilleure inscription. */
function simuler(des, gardes, grille, lancersRestants, rng) {
  let essai = des.map((face, i) => (gardes[i] ? face : lancerDe(rng)));
  for (let l = 1; l < lancersRestants; l++) {
    const suivantes = gardesRapides(essai, grille);
    essai = essai.map((face, i) => (suivantes[i] ? face : lancerDe(rng)));
  }
  return valeurLancer(essai, grille);
}

/**
 * Dés à garder : on essaie les 32 combinaisons (dédupliquées — garder le premier
 * ou le second des deux 4 revient au même) et on retient celle dont les relances
 * simulées rapportent le plus en moyenne.
 */
export function choisirGardes(des, grille, lancersRestants, { rng = Math.random, tirages = 70 } = {}) {
  if (lancersRestants <= 0) return des.map(() => true);
  const vues = new Set();
  let meilleures = des.map(() => true);
  let meilleure = -Infinity;

  for (let masque = 0; masque < (1 << NB_DES); masque++) {
    const gardes = des.map((_, i) => ((masque >> i) & 1) === 1);
    const cle = des.filter((_, i) => gardes[i]).sort().join('');
    if (vues.has(cle)) continue;
    vues.add(cle);

    let total = 0;
    for (let t = 0; t < tirages; t++) total += simuler(des, gardes, grille, lancersRestants, rng);
    const moyenne = total / tirages;
    if (moyenne > meilleure) {
      meilleure = moyenne;
      meilleures = gardes;
    }
  }
  return meilleures;
}
