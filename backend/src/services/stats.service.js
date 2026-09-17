import { query, anneeActive } from '../config/db.js';

/** Totaux d'une année (RG3, RG4) — depuis la table unique cotisations. */
export async function totauxAnnee(anneeId) {
  const { rows } = await query(
    `SELECT a.libelle, a.total_cible::float8 AS total_cible,
            COALESCE(SUM(c.sommes), 0)::float8     AS sommes,
            COALESCE(SUM(c.transferts), 0)::float8 AS transferts,
            COUNT(c.id)::int                       AS nb
       FROM annees_scolaires a
       LEFT JOIN cotisations c ON c.annee_id = a.id
      WHERE a.id = $1 GROUP BY a.id`, [anneeId]);
  const t = rows[0];
  return {
    annee: t.libelle, cible: +t.total_cible, sommes: +t.sommes,
    transferts: +t.transferts, nb_paiements: t.nb,
    reste: +t.total_cible - (+t.sommes + +t.transferts),
  };
}

export async function resoudreAnnee(anneeId) {
  if (anneeId) return { id: +anneeId };
  const a = await anneeActive();
  if (!a) throw Object.assign(new Error('Aucune année scolaire active'), { status: 422 });
  return a;
}
