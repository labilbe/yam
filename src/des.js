// Les cinq dés : lancer, relance partielle, comptage des faces.

export const NB_DES = 5;
export const LANCERS_PAR_TOUR = 3;

export const lancerDe = (rng = Math.random) => 1 + Math.floor(rng() * 6);

export function lancerTous(rng = Math.random) {
  return Array.from({ length: NB_DES }, () => lancerDe(rng));
}

/** Relance les dés non gardés ; `gardes` est un tableau de booléens. */
export function relancer(des, gardes, rng = Math.random) {
  return des.map((face, i) => (gardes[i] ? face : lancerDe(rng)));
}

/** compte[f] = nombre de dés affichant la face f (indices 1 à 6, l'indice 0 reste nul). */
export function compter(des) {
  const compte = [0, 0, 0, 0, 0, 0, 0];
  for (const face of des) compte[face] += 1;
  return compte;
}

export const somme = (des) => des.reduce((s, face) => s + face, 0);

/** Longueur de la plus longue suite de faces présentes (4 pour 2-3-4-5). */
export function suiteMax(compte) {
  let meilleure = 0;
  let courante = 0;
  for (let face = 1; face <= 6; face++) {
    courante = compte[face] > 0 ? courante + 1 : 0;
    if (courante > meilleure) meilleure = courante;
  }
  return meilleure;
}
