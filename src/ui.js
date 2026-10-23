// Interface : feuille de marque, piste de dés, rythme de l'adversaire.

import { LANCERS_PAR_TOUR, NB_DES } from './des.js';
import { faceDe } from './faces.js';
import { Game, NB_TOURS } from './game.js';
import { choisirCase, choisirGardes } from './ai.js';
import { CASES_BASSES, CASES_HAUTES, PRIME, PRIME_SEUIL } from './rules.js';

const DELAIS = { lancer: 750, garde: 550, inscription: 850, fin: 700 };
// Simulations par garde envisagée : au-delà l'adversaire ne joue pas mieux,
// il réfléchit seulement plus longtemps.
const TIRAGES_IA = 90;

const $ = (id) => document.getElementById(id);
const pause = (ms) => new Promise((resoudre) => { setTimeout(resoudre, ms); });

let game = new Game();
let animes = []; // Indices des dés qui viennent de rouler.
let dernierCoup = null; // { joueur, id } : la case que l'on vient de remplir.
let occupe = false; // L'ordinateur joue : les commandes sont verrouillées.

const aLaMain = () => !occupe && game.phase === 'tour' && game.joueur === 0;
const peutGarder = () => aLaMain() && game.lancers > 0 && game.lancers < LANCERS_PAR_TOUR;

// ------------------------------------------------------------------ Dés

function rendreDes() {
  const zone = $('des');
  zone.innerHTML = '';
  for (let i = 0; i < NB_DES; i++) {
    const valeur = game.des ? game.des[i] : 0;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'de';
    if (!valeur) el.classList.add('vide');
    if (game.gardes[i]) el.classList.add('gardee');
    if (animes.includes(i)) el.classList.add('roule');
    el.innerHTML = faceDe(valeur);
    el.disabled = !peutGarder();
    el.setAttribute('aria-pressed', String(game.gardes[i]));
    el.setAttribute('aria-label', valeur
      ? `Dé ${valeur}${game.gardes[i] ? ', gardé' : ''}`
      : 'Dé non lancé');
    el.addEventListener('click', () => {
      if (game.basculerGarde(i)) {
        animes = [];
        rendre();
      }
    });
    zone.appendChild(el);
  }
}

// -------------------------------------------------------- Feuille de marque

function celluleCase(info, joueur) {
  const td = document.createElement('td');
  const valeur = game.grilles[joueur][info.id];
  if (valeur !== null) {
    td.className = valeur === 0 ? 'prise nulle' : 'prise';
    td.textContent = valeur;
    if (dernierCoup && dernierCoup.joueur === joueur && dernierCoup.id === info.id) {
      td.classList.add('fraiche');
    }
    return td;
  }
  // Seules les cases du joueur, et seulement une fois les dés sortis, s'offrent.
  if (joueur === 0 && aLaMain() && game.peutInscrire()) {
    const apercu = game.apercu(info.id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = apercu === 0 ? 'inscrire nulle' : 'inscrire';
    b.textContent = apercu;
    b.title = `Inscrire ${apercu} en ${info.nom}`;
    b.addEventListener('click', () => inscrire(info.id));
    td.className = 'libre';
    td.appendChild(b);
    return td;
  }
  td.innerHTML = '<span class="attente">·</span>';
  return td;
}

function ligneCase(info) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.scope = 'row';
  th.textContent = info.nom;
  th.title = info.aide;
  tr.appendChild(th);
  for (let j = 0; j < game.joueurs.length; j++) tr.appendChild(celluleCase(info, j));
  return tr;
}

function ligneTotal(libelle, valeurs, classe = '') {
  const tr = document.createElement('tr');
  tr.className = `ligne-total ${classe}`.trim();
  const th = document.createElement('th');
  th.scope = 'row';
  th.textContent = libelle;
  tr.appendChild(th);
  for (const v of valeurs) {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  }
  return tr;
}

/** La prime : acquise, ou l'avance en section haute tant qu'elle se joue. */
function textePrime(joueur) {
  const { haute, prime } = game.totaux(joueur);
  return prime ? String(PRIME) : `${haute} / ${PRIME_SEUIL}`;
}

function rendreFeuille() {
  const corps = $('feuille-corps');
  corps.innerHTML = '';
  for (const info of CASES_HAUTES) corps.appendChild(ligneCase(info));
  corps.appendChild(ligneTotal(
    `Prime (${PRIME_SEUIL} points)`,
    game.joueurs.map((_, j) => textePrime(j)),
    'ligne-prime',
  ));
  for (const info of CASES_BASSES) corps.appendChild(ligneCase(info));
  corps.appendChild(ligneTotal(
    'Total',
    game.joueurs.map((_, j) => game.totaux(j).total),
    'ligne-forte',
  ));
}

// ----------------------------------------------------------------- En-têtes

function rendreEntetes() {
  game.joueurs.forEach((nom, j) => {
    $(`nom-${j}`).textContent = nom;
    $(`col-${j}`).textContent = nom;
    $(`score-${j}`).textContent = game.totaux(j).total;
  });
  $('info-tour').textContent = `Tour ${Math.min(game.tour, NB_TOURS)} / ${NB_TOURS}`;

  const pastille = $('info-joueur');
  if (game.phase === 'fin') {
    pastille.textContent = 'Partie terminée';
    pastille.classList.remove('actif');
  } else {
    pastille.textContent = game.joueur === 0 ? 'À vous' : 'À l’ordinateur';
    pastille.classList.toggle('actif', game.joueur === 0);
  }
}

function rendreConsigne() {
  const consigne = $('consigne');
  const bouton = $('btn-lancer');
  if (game.phase === 'fin') {
    consigne.textContent = '';
    bouton.hidden = true;
    return;
  }
  bouton.hidden = false;
  const restants = game.lancersRestants();
  if (game.lancers === 0) bouton.textContent = 'Lancer les dés';
  else if (restants === 0) bouton.textContent = 'Plus de relance';
  else bouton.textContent = `Relancer (${restants} lancer${restants > 1 ? 's' : ''})`;
  const toutGarde = game.gardes.every(Boolean);
  bouton.disabled = !aLaMain() || !game.peutLancer() || (game.lancers > 0 && toutGarde);

  if (!aLaMain()) {
    consigne.textContent = 'L’ordinateur joue…';
  } else if (game.lancers === 0) {
    consigne.textContent = 'À vous : lancez les cinq dés.';
  } else if (game.lancers < LANCERS_PAR_TOUR) {
    consigne.textContent = toutGarde
      ? 'Tous les dés sont gardés : choisissez une case.'
      : 'Cliquez les dés à garder, puis relancez — ou inscrivez dès maintenant.';
  } else {
    consigne.textContent = 'Dernier lancer : il faut inscrire une case.';
  }
}

function rendreJournal() {
  $('journal').innerHTML = game.journal.slice(-9).map((l) => `<p>${l}</p>`).join('');
}

function rendre() {
  rendreEntetes();
  rendreDes();
  rendreFeuille();
  rendreConsigne();
  rendreJournal();
}

// ---------------------------------------------------------- Déroulé du tour

/** Lance, en notant quels dés roulent pour l'animation. */
function lancerDes() {
  const gardes = game.gardes.slice();
  if (!game.lancer()) return false;
  animes = gardes.map((garde, i) => (garde ? -1 : i)).filter((i) => i >= 0);
  return true;
}

function inscrire(id) {
  const joueur = game.joueur;
  if (!game.inscrire(id)) return;
  dernierCoup = { joueur, id };
  animes = [];
  rendre();
  if (game.phase === 'fin') finPartie();
  else tourOrdinateur();
}

async function tourOrdinateur() {
  if (game.phase !== 'tour' || game.joueur !== 1) return;
  occupe = true;
  rendre();

  while (game.peutLancer()) {
    lancerDes();
    rendre();
    await pause(DELAIS.lancer);
    if (!game.peutLancer()) break;
    const gardes = choisirGardes(game.des, game.grille, game.lancersRestants(), { tirages: TIRAGES_IA });
    if (gardes.every(Boolean)) break; // Plus rien à relancer : il s'arrête là.
    game.definirGardes(gardes);
    animes = [];
    rendre();
    await pause(DELAIS.garde);
  }

  const id = choisirCase(game.des, game.grille);
  await pause(DELAIS.inscription);
  game.inscrire(id);
  dernierCoup = { joueur: 1, id };
  animes = [];
  occupe = false;
  rendre();
  if (game.phase === 'fin') finPartie();
}

// ----------------------------------------------------------------- Panneaux

function finPartie() {
  const { gagnant, scores } = game.resultat;
  $('fin-titre').textContent = gagnant === null
    ? `Égalité, ${scores[0]} partout`
    : `${game.joueurs[gagnant]} ${gagnant === 0 ? 'l’emportez' : 'l’emporte'}`
      + ` — ${scores[gagnant]} à ${scores[1 - gagnant]}`;

  const feuille = $('fin-feuille');
  feuille.innerHTML = '';
  const entete = document.createElement('tr');
  entete.innerHTML = `<th></th>${game.joueurs.map((nom) => `<th>${nom}</th>`).join('')}`;
  feuille.appendChild(entete);
  const lignes = [
    ['Section haute', (t) => t.haute],
    ['Prime', (t) => t.prime],
    ['Section basse', (t) => t.basse],
    ['Total', (t) => t.total],
  ];
  lignes.forEach(([libelle, lire], i) => {
    feuille.appendChild(ligneTotal(
      libelle,
      game.joueurs.map((_, j) => lire(game.totaux(j))),
      i === lignes.length - 1 ? 'ligne-forte' : '',
    ));
  });
  setTimeout(() => { $('panneau-fin').hidden = false; }, DELAIS.fin);
}

function nouvellePartie() {
  game = new Game();
  animes = [];
  dernierCoup = null;
  occupe = false;
  $('panneau-fin').hidden = true;
  rendre();
}

// ------------------------------------------------------------- Démarrage

$('btn-lancer').addEventListener('click', () => {
  if (!aLaMain() || !game.peutLancer()) return;
  lancerDes();
  rendre();
});
$('btn-rejouer').addEventListener('click', nouvellePartie);
$('btn-regles').addEventListener('click', () => $('dlg-regles').showModal());
$('btn-fermer-regles').addEventListener('click', () => $('dlg-regles').close());

rendre();
