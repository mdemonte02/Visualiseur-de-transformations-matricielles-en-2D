const $ = id => document.getElementById(id);
const canvas = $('graph');
const ctx = canvas.getContext('2d');
let pointsOriginaux = [];
let matriceComposee = IDENTITE.map(ligne => [...ligne]);
let historique = [];

function lirePoints() {
  const lignes = $('points').value.trim().split(/\n/).filter(ligne => ligne.trim());
  if (lignes.length < 3) throw new Error('Entrez au moins trois points.');
  return lignes.map((ligne, index) => {
    const morceaux = ligne.split(',');
    if (morceaux.length !== 2 || morceaux.some(v => !v.trim() || !Number.isFinite(Number(v.trim())))) {
      throw new Error(`Point ${index + 1} invalide : utilisez x,y (exemple : 2,3).`);
    }
    return { x: Number(morceaux[0]), y: Number(morceaux[1]) };
  });
}

function afficherMessage(texte, erreur = false) {
  $('message').textContent = texte;
  $('message').classList.toggle('error', erreur);
}

function rafraichirHistorique() {
  $('history').replaceChildren();
  if (!historique.length) {
    const li = document.createElement('li');
    li.textContent = 'Aucune transformation appliquée.';
    $('history').append(li);
  }
  historique.forEach(operation => {
    const li = document.createElement('li');
    li.textContent = operation;
    $('history').append(li);
  });
  $('matrixInfo').textContent = 'Matrice composée :\n' + matriceComposee.map(l => '[ ' + l.map(n => Number(n.toFixed(3))).join('   ') + ' ]').join('\n');
}

function dessiner() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!pointsOriginaux.length) return;
  const transformes = pointsOriginaux.map(p => transformerPoint(matriceComposee, p));
  const tous = [...pointsOriginaux, ...transformes, { x: 0, y: 0 }];
  const limite = Math.max(5, ...tous.flatMap(p => [Math.abs(p.x), Math.abs(p.y)])) * 1.2;
  const unite = Math.min(w, h) / (2 * limite);
  const X = x => w / 2 + x * unite;
  const Y = y => h / 2 - y * unite;

  ctx.lineWidth = 1;
  ctx.font = '12px sans-serif';
  const pas = Math.max(1, Math.ceil(limite / 10));
  for (let valeur = -Math.ceil(limite / pas) * pas; valeur <= limite; valeur += pas) {
    const x = X(valeur), y = Y(valeur);
    ctx.strokeStyle = '#e3eaf2';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    if (valeur !== 0) {
      ctx.fillStyle = '#64748b';
      if (x > 10 && x < w - 18) ctx.fillText(String(valeur), x + 3, Y(0) + 14);
      if (y > 12 && y < h - 6) ctx.fillText(String(valeur), X(0) + 5, y - 5);
    }
  }
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
  ctx.fillStyle = '#334155';
  ctx.fillText('x', w - 14, Y(0) - 8); ctx.fillText('y', X(0) + 8, 14);

  function tracerPolygone(points, trait, remplissage) {
    ctx.beginPath();
    points.forEach((p, index) => index === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y)));
    ctx.closePath();
    ctx.fillStyle = remplissage; ctx.fill();
    ctx.strokeStyle = trait; ctx.lineWidth = 2.5; ctx.stroke();
    points.forEach((p, index) => {
      ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 4, 0, 2 * Math.PI); ctx.fillStyle = trait; ctx.fill();
      ctx.fillStyle = trait; ctx.fillText(String.fromCharCode(65 + index), X(p.x) + 7, Y(p.y) - 8);
    });
  }
  tracerPolygone(pointsOriginaux, '#2563eb', 'rgba(37, 99, 235, .10)');
  tracerPolygone(transformes, '#ea580c', 'rgba(234, 88, 12, .15)');
}

function reinitialiser() {
  matriceComposee = IDENTITE.map(ligne => [...ligne]);
  historique = [];
  rafraichirHistorique();
  dessiner();
}

$('update').addEventListener('click', () => {
  try {
    pointsOriginaux = lirePoints();
    reinitialiser();
    afficherMessage('Polygone mis à jour.');
  } catch (e) { afficherMessage(e.message, true); }
});

$('transformation').addEventListener('change', () => {
  const type = $('transformation').value;
  const translationActive = type === 'translation';
  const echelleActive = type === 'scaleX' || type === 'scaleY';
  for (const id of ['a', 'b']) {
    $(id).hidden = !translationActive;
    document.querySelector(`label[for="${id}"]`).hidden = !translationActive;
  }
  $('k').hidden = !echelleActive;
  document.querySelector('label[for="k"]').hidden = !echelleActive;
});

$('apply').addEventListener('click', () => {
  const type = $('transformation').value;
  const a = Number($('a').value), b = Number($('b').value), k = Number($('k').value);
  let matrice, description;
  if (type === 'translation') {
    if (!$('a').value || !$('b').value || !Number.isFinite(a) || !Number.isFinite(b)) return afficherMessage('Entrez a et b.', true);
    matrice = translation(a, b); description = `Translation (${a}, ${b})`;
  } else if (type === 'scaleX' || type === 'scaleY') {
    if (!$('k').value || !Number.isFinite(k)) return afficherMessage('Entrez un facteur k valide.', true);
    matrice = type === 'scaleX' ? echelleHorizontale(k) : echelleVerticale(k);
    description = `${type === 'scaleX' ? 'Échelle horizontale' : 'Échelle verticale'} (k = ${k})`;
  } else {
    matrice = rotation90(); description = 'Rotation de 90° antihoraire';
  }
  // Nouvelle transformation à gauche : M_nouvelle × M_précédente.
  matriceComposee = multiplierMatrices(matrice, matriceComposee);
  historique.push(description);
  rafraichirHistorique();
  dessiner();
  afficherMessage('Transformation appliquée.');
});

$('reset').addEventListener('click', () => {
  reinitialiser(); afficherMessage('Transformations réinitialisées.');
});

pointsOriginaux = lirePoints();
rafraichirHistorique();
dessiner();
