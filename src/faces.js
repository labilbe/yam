// Faces des dés : la disposition des points, en SVG inline.

const POINTS = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]],
};

/** Face d'un dé ; `valeur` nulle rend un dé vide (avant le premier lancer). */
export function faceDe(valeur) {
  const points = (POINTS[valeur] || [])
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5"/>`)
    .join('');
  return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="currentColor">${points}</g>
  </svg>`;
}
