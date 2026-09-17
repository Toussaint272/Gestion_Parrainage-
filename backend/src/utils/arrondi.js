/**
 * RG10 (règle définitive) — Arrondi de la somme des frais (envoi + retrait)
 * AU MILLIER SUPÉRIEUR, toujours vers la tranche au-dessus, même si la somme
 * tombe exactement sur un millier :
 *   1 000 → 2 000 · 1 500 → 2 000 · 1 999 → 2 000 · 2 000 → 3 000 · 6 000 → 7 000
 * Formule : multiple de 1 000 inférieur + 1 000.
 */
export function arrondir(montant, pas = +(process.env.ARRONDI_PAS || 1000)) {
  const m = Number(montant);
  if (!m || m <= 0) return 0;
  return Math.floor(m / pas) * pas + pas;
}

export const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR');