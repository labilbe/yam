// Moteur de partie : treize tours de trois lancers, inscription sur la feuille, fin de partie.

import { LANCERS_PAR_TOUR, NB_DES, lancerTous, relancer } from './des.js';
import { CASES, CASE_PAR_ID, grilleVide, grilleComplete, scoreCase, totaux } from './rules.js';

export const NB_TOURS = CASES.length;
export const JOUEURS = ['Vous', 'Ordinateur'];

export class Game {
  constructor({ joueurs = JOUEURS, rng = Math.random } = {}) {
    this.joueurs = joueurs;
    this.rng = rng;
    this.grilles = joueurs.map(() => grilleVide());
    this.journal = [];
    this.resultat = null;
    this.tour = 1;
    this.joueur = 0;
    this.phase = 'tour'; // 'tour' | 'fin'
    this.nouveauTour();
    this.log(`— Tour 1 — à ${this.joueurs[0]}`);
  }

  log(texte) {
    this.journal.push(texte);
    if (this.journal.length > 60) this.journal.shift();
  }

  /** Grille du joueur dont c'est le tour. */
  get grille() {
    return this.grilles[this.joueur];
  }

  nouveauTour() {
    this.des = null; // Pas encore lancés.
    this.gardes = Array(NB_DES).fill(false);
    this.lancers = 0;
  }

  lancersRestants() {
    return LANCERS_PAR_TOUR - this.lancers;
  }

  peutLancer() {
    return this.phase === 'tour' && this.lancers < LANCERS_PAR_TOUR;
  }

  /** On ne peut inscrire qu'une fois les dés sortis — mais dès le premier lancer. */
  peutInscrire() {
    return this.phase === 'tour' && this.lancers > 0;
  }

  lancer() {
    if (!this.peutLancer()) return false;
    this.des = this.des === null
      ? lancerTous(this.rng)
      : relancer(this.des, this.gardes, this.rng);
    this.lancers += 1;
    return true;
  }

  basculerGarde(i) {
    if (this.phase !== 'tour' || this.lancers === 0 || this.lancers >= LANCERS_PAR_TOUR) return false;
    this.gardes[i] = !this.gardes[i];
    return true;
  }

  definirGardes(gardes) {
    if (this.phase !== 'tour' || this.lancers === 0) return false;
    this.gardes = gardes.slice();
    return true;
  }

  /** Ce que vaudraient les dés actuels dans la case `id`, ou null si elle est prise. */
  apercu(id) {
    if (!this.peutInscrire() || this.grille[id] !== null) return null;
    return scoreCase(id, this.des);
  }

  inscrire(id) {
    if (!this.peutInscrire() || this.grille[id] !== null) return false;
    const points = scoreCase(id, this.des);
    this.grille[id] = points;
    const nom = CASE_PAR_ID.get(id).nom;
    this.log(`${this.joueurs[this.joueur]} : ${nom} — ${points} point${points > 1 ? 's' : ''}`);
    this.tourSuivant();
    return true;
  }

  tourSuivant() {
    this.nouveauTour();
    this.joueur = (this.joueur + 1) % this.joueurs.length;
    if (this.joueur === 0) this.tour += 1;
    if (this.grilles.every(grilleComplete)) {
      this.phase = 'fin';
      this.resultat = this.classement();
      const { total } = this.totaux(this.resultat.gagnant ?? 0);
      this.log(this.resultat.gagnant === null
        ? `— Égalité à ${total} points`
        : `— ${this.joueurs[this.resultat.gagnant]} l'emporte avec ${total} points`);
    } else if (this.joueur === 0) {
      this.log(`— Tour ${this.tour} —`);
    }
  }

  totaux(joueur) {
    return totaux(this.grilles[joueur]);
  }

  /** Gagnant de la partie, `gagnant` à null en cas d'égalité. */
  classement() {
    const scores = this.grilles.map((_, j) => this.totaux(j).total);
    const meilleur = Math.max(...scores);
    const exaequo = scores.filter((s) => s === meilleur).length > 1;
    return { scores, meilleur, gagnant: exaequo ? null : scores.indexOf(meilleur) };
  }
}
