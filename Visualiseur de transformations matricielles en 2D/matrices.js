function translation(a, b) {
  return [[1, 0, a], [0, 1, b], [0, 0, 1]];
}

function echelleHorizontale(k) {
  return [[k, 0, 0], [0, 1, 0], [0, 0, 1]];
}

function echelleVerticale(k) {
  return [[1, 0, 0], [0, k, 0], [0, 0, 1]];
}

function rotation90() {
  return [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
}

function multiplierMatriceVecteur(matrice, vecteur) {
  return matrice.map(ligne =>
    ligne.reduce((somme, coefficient, i) => somme + coefficient * vecteur[i], 0)
  );
}

function multiplierMatrices(a, b) {
  return a.map(ligne =>
    b[0].map((_, colonne) =>
      ligne.reduce((somme, coefficient, i) => somme + coefficient * b[i][colonne], 0)
    )
  );
}

const IDENTITE = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function transformerPoint(matrice, point) {
  const [x, y, w] = multiplierMatriceVecteur(matrice, [point.x, point.y, 1]);
  return { x: x / w, y: y / w };
}
