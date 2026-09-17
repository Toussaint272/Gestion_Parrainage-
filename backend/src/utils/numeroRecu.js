/** RG6 — numéro de reçu lisible : REC-2627-0042 (année 26-27, paiement n° 42). */
export function numeroRecu(anneeLibelle, paiementId) {
  const annee = String(anneeLibelle || '').replace(/[^0-9-]/g, '').replace('-', '');
  return `REC-${annee}-${String(paiementId).padStart(4, '0')}`;
}
