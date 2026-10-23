# Yam's

Jeu de **Yam's** à cinq dés, jouable directement dans le navigateur contre un adversaire géré par
l'ordinateur. Aucun serveur, aucune dépendance : du HTML, du CSS et des modules JavaScript natifs.

▶️ **Jouer : https://labilbe.github.io/yam/**

## Règles appliquées

- Cinq dés, **treize tours** par joueur — un par case de la feuille de marque.
- À chaque tour : un premier lancer obligatoire, puis jusqu'à **deux relances**. On garde les dés
  que l'on veut en cliquant dessus ; les autres repartent.
- Le tour se termine par l'inscription du résultat dans une case **libre** de sa feuille. On peut
  inscrire dès le premier lancer, et il faut inscrire au troisième, quitte à marquer zéro.
- **Section haute** — As, Deux, Trois, Quatre, Cinq, Six : le total des dés de la face
  correspondante.
- **Prime** : 35 points si la section haute atteint 63 points, soit trois dés de chaque face en
  moyenne.
- **Section basse** :

  | Case | Condition | Points |
  | --- | --- | --- |
  | Brelan | trois dés identiques | total des cinq dés |
  | Carré | quatre dés identiques | total des cinq dés |
  | Full | un brelan et une paire | 25 |
  | Petite suite | quatre dés qui se suivent | 30 |
  | Grande suite | cinq dés qui se suivent | 40 |
  | Yam's | cinq dés identiques | 50 |
  | Chance | aucune | total des cinq dés |

- Cinq dés identiques forment un carré, mais **pas un full** : il y faut une paire distincte du
  brelan. De même, quatre dés qui se suivent ne valent pas la grande suite.
- Un **second Yam's** n'ouvre droit à aucune prime supplémentaire ni à aucun joker : il s'inscrit
  comme n'importe quel autre lancer, dans la case libre de son choix.
- La partie s'achève quand les deux feuilles sont pleines ; le plus grand total l'emporte.

## Jouer en local

Les modules ES imposent de servir les fichiers par HTTP (un simple `file://` ne suffit pas) :

```bash
npx serve .          # ou : python -m http.server 8000
```

puis ouvrir `http://localhost:3000`.

## Tests

Le moteur est vérifié par des tests unitaires (valeur de chaque combinaison, cas limites des
suites et du full, totaux, seuil de la prime, déroulé d'un tour) puis par auto-parties : 120
parties jouées par l'IA, en contrôlant que chaque case est remplie une fois et une seule, que le
score inscrit est bien celui des dés, que les totaux se recomposent et que le niveau de jeu reste
plausible.

```bash
npm test
```

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/des.js` | Les cinq dés : lancer, relance partielle, comptage des faces, plus longue suite. |
| `src/rules.js` | Les treize cases, le décompte de chacune, les totaux et la prime. |
| `src/game.js` | Machine à états : tours, lancers, gardes, inscription, fin de partie. |
| `src/ai.js` | Choix des dés à garder et de la case à remplir chez l'adversaire. |
| `src/faces.js` | Faces des dés, en SVG. |
| `src/ui.js` | Rendu de la feuille, piste de dés et interactions du joueur. |

## L'adversaire

Pour **choisir ses dés**, l'ordinateur énumère les 32 façons de garder un sous-ensemble des cinq
dés — dédupliquées, garder l'un ou l'autre des deux 4 revenant au même — et simule les relances
qui restent, quelques dizaines de fois chacune. Il retient la garde dont les tirages rapportent le
plus en moyenne. À l'intérieur d'une simulation, les relances suivantes ne sont pas cherchées à
nouveau : une heuristique rapide conserve la suite amorcée, ou à défaut le plus gros paquet de dés
identiques.

Reste à dire ce que « rapporter » veut dire, puisqu'un tour ne se juge pas à ses seuls points
(`valeurInscription`) :

- en section haute, tant que la prime se joue, c'est l'**écart avec les trois dés attendus** qui
  compte : un 6 manquant coûte bien plus que six points, tandis qu'un quatrième 6 ne sert qu'à
  couvrir une autre case et vaut donc moins ;
- ailleurs, une case rendue en dessous de son **rendement de référence** (20 pour un brelan, 22
  pour la chance, 50 pour le Yam's…) est en partie perdue : on retire le manque à gagner, sinon
  l'adversaire braderait sa Chance ou son Yam's au premier lancer médiocre venu.

Les coefficients de ce barème ont été réglés par auto-parties, en retenant ceux qui donnent le
meilleur score moyen. Tel que l'interface le fait jouer — 90 simulations par garde envisagée —
l'adversaire marque **213 points en moyenne** (± 2 sur 600 feuilles), décroche la prime des 63
un peu plus d'une fois sur quatre et sort un Yam's dans trois parties sur dix.

Publié via GitHub Pages depuis la branche `main` (fichier `.nojekyll` pour servir le dossier tel quel).
