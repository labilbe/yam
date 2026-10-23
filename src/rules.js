// Feuille de marque : les treize cases, ce que vaut un lancer dans chacune, les totaux.

import { compter, somme, suiteMax } from './des.js';

export const PRIME_SEUIL = 63;
export const PRIME = 35;

// Le champ `attendu` n'est pas une règle : c'est le rendement de référence d'une case,
// dont l'adversaire se sert pour juger s'il la brade (voir src/ai.js).
export const CASES = [
  { id: 'as', nom: 'As', section: 'haute', face: 1, attendu: 3, aide: 'Total des 1' },
  { id: 'deux', nom: 'Deux', section: 'haute', face: 2, attendu: 6, aide: 'Total des 2' },
  { id: 'trois', nom: 'Trois', section: 'haute', face: 3, attendu: 9, aide: 'Total des 3' },
  { id: 'quatre', nom: 'Quatre', section: 'haute', face: 4, attendu: 12, aide: 'Total des 4' },
  { id: 'cinq', nom: 'Cinq', section: 'haute', face: 5, attendu: 15, aide: 'Total des 5' },
  { id: 'six', nom: 'Six', section: 'haute', face: 6, attendu: 18, aide: 'Total des 6' },
  { id: 'brelan', nom: 'Brelan', section: 'basse', attendu: 20, aide: 'Trois dés identiques — total des cinq dés' },
  { id: 'carre', nom: 'Carré', section: 'basse', attendu: 24, aide: 'Quatre dés identiques — total des cinq dés' },
  { id: 'full', nom: 'Full', section: 'basse', attendu: 25, aide: 'Un brelan et une paire — 25 points' },
  { id: 'petiteSuite', nom: 'Petite suite', section: 'basse', attendu: 30, aide: 'Quatre dés qui se suivent — 30 points' },
  { id: 'grandeSuite', nom: 'Grande suite', section: 'basse', attendu: 40, aide: 'Cinq dés qui se suivent — 40 points' },
  { id: 'yam', nom: 'Yam\u2019s', section: 'basse', attendu: 50, aide: 'Cinq dés identiques — 50 points' },
  { id: 'chance', nom: 'Chance', section: 'basse', attendu: 22, aide: 'Total des cinq dés, sans condition' },
];

export const CASES_HAUTES = CASES.filter((c) => c.section === 'haute');
export const CASES_BASSES = CASES.filter((c) => c.section === 'basse');
export const CASE_PAR_ID = new Map(CASES.map((c) => [c.id, c]));

/** Ce que rapporterait `des` inscrit dans la case `id`, zéro si la figure n'y est pas. */
export function scoreCase(id, des) {
  const info = CASE_PAR_ID.get(id);
  if (!info) throw new Error(`case inconnue : ${id}`);
  const compte = compter(des);
  if (info.section === 'haute') return compte[info.face] * info.face;

  // Tailles des paquets de dés identiques, du plus gros au plus petit.
  const paquets = compte.slice(1).sort((a, b) => b - a);
  switch (id) {
    case 'brelan': return paquets[0] >= 3 ? somme(des) : 0;
    case 'carre': return paquets[0] >= 4 ? somme(des) : 0;
    case 'full': return paquets[0] >= 3 && paquets[1] >= 2 ? 25 : 0;
    case 'petiteSuite': return suiteMax(compte) >= 4 ? 30 : 0;
    case 'grandeSuite': return suiteMax(compte) >= 5 ? 40 : 0;
    case 'yam': return paquets[0] === 5 ? 50 : 0;
    case 'chance': return somme(des);
    default: throw new Error(`case non décomptée : ${id}`);
  }
}

export const grilleVide = () => Object.fromEntries(CASES.map((c) => [c.id, null]));

export const casesLibres = (grille) => CASES.filter((c) => grille[c.id] === null).map((c) => c.id);

export const grilleComplete = (grille) => casesLibres(grille).length === 0;

export function totaux(grille) {
  const points = (c) => grille[c.id] ?? 0;
  const haute = CASES_HAUTES.reduce((s, c) => s + points(c), 0);
  const basse = CASES_BASSES.reduce((s, c) => s + points(c), 0);
  const prime = haute >= PRIME_SEUIL ? PRIME : 0;
  return { haute, prime, basse, total: haute + prime + basse };
}

/** La prime est-elle encore en jeu ? (ni acquise, ni devenue hors d'atteinte) */
export function primeEnJeu(grille) {
  const { haute } = totaux(grille);
  if (haute >= PRIME_SEUIL) return false;
  const reste = CASES_HAUTES
    .filter((c) => grille[c.id] === null)
    .reduce((s, c) => s + 5 * c.face, 0);
  return haute + reste >= PRIME_SEUIL;
}
