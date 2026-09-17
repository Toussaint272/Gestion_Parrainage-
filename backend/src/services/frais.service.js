import { query } from '../config/db.js';
import { arrondir, fmt } from '../utils/arrondi.js';
import { AppError } from '../utils/appError.js';

/**
 * RG9 + RG10 — calcule les frais d'envoi et/ou de retrait d'après le barème
 * de l'opérateur, puis arrondit la somme au multiple supérieur (1 000 Ar).
 * Retourne aussi le libellé du barème pour affichage dans l'interface.
 */
export async function calculerFrais({ montant, operateur = 'mvola', types = ['envoi', 'retrait'] }) {
  const { rows } = await query(
    `SELECT type_frais, tranche_min, tranche_max, frais
       FROM bareme_frais
      WHERE operateur = $1
        AND type_frais = ANY($2::varchar[])
        AND tranche_min <= $3 AND tranche_max >= $3`,
    [operateur, types, montant]
  );
  if (rows.length < types.length) {
    throw new AppError(422, `Aucune tranche du barème « ${operateur} » ne couvre le montant ${fmt(montant)} Ar pour : ${types.join(', ')}. Vérifiez le barème dans les Paramètres.`);
  }
  const detail = rows
    .sort((a, b) => a.type_frais.localeCompare(b.type_frais))
    .map((r) => ({ type: r.type_frais, tranche: `${fmt(r.tranche_min)} – ${fmt(r.tranche_max)}`, frais: +r.frais }));
  const somme_frais = detail.reduce((s, d) => s + d.frais, 0);
  const frais_total = arrondir(somme_frais);
  return {
    montant: +montant, operateur, detail,
    somme_frais, frais_total,
    regle: `Somme des frais ${fmt(somme_frais)} Ar, arrondie au millier supérieur (RG10)`,
  };
}
