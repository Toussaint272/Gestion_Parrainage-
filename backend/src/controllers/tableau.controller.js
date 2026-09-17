import { query } from '../config/db.js';
import { resoudreAnnee, totauxAnnee } from '../services/stats.service.js';

/** GET /statistiques/:anneeId? — indicateurs du tableau de bord. */
export const statistiques = async (req, res, next) => {
  try {
    const annee = await resoudreAnnee(req.params.anneeId || req.query.annee_id);
    const totaux = await totauxAnnee(annee.id);
    const serie = await query(
      `SELECT to_char(date_trunc('month', cree_le), 'YYYY-MM') AS mois,
              SUM(sommes)::float8 AS sommes, SUM(transferts)::float8 AS transferts
         FROM cotisations WHERE annee_id = $1 GROUP BY 1 ORDER BY 1`, [annee.id]);
    const comp = await query(
      `SELECT COUNT(*)::int AS parents,
              COALESCE(SUM(array_length(string_to_array(trim(noms_enfants), ','), 1)), 0)::int AS enfants
         FROM cotisations WHERE annee_id = $1 AND noms_enfants IS NOT NULL`, [annee.id]);
    res.json({ success: true, data: { ...totaux, serie: serie.rows, compteurs: { parents: comp.rows[0].parents, enfants: comp.rows[0].enfants } } });
  } catch (e) { next(e); }
};
