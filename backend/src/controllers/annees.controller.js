import { query } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export const lister = async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT *, total_cible::float8 AS total_cible FROM annees_scolaires ORDER BY date_debut DESC`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

/** POST /annees-scolaires — crée une année. statut='active' → l'année en cours est
 *  archivée AUTOMATIQUEMENT (une seule année active à la fois — RG8) : l'application
 *  peut ainsi être réutilisée d'année en année sans rien perdre. */
export const creer = async (req, res, next) => {
  try {
    const { libelle, date_debut, date_fin, total_cible, statut } = req.body;
    const doublon = await query(`SELECT 1 FROM annees_scolaires WHERE libelle = $1`, [libelle]);
    if (doublon.rows[0]) throw new AppError(409, `L'année ${libelle} existe déjà — choisissez un autre libellé.`);
    if (statut === 'active') await query(`UPDATE annees_scolaires SET statut='archivee' WHERE statut='active'`); // RG8
    const { rows } = await query(
      `INSERT INTO annees_scolaires (libelle, date_debut, date_fin, total_cible, statut) VALUES ($1,$2,$3,$4,$5) RETURNING *, total_cible::float8 AS total_cible`,
      [libelle, date_debut, date_fin, total_cible || 0, statut || 'archivee']);
    res.status(201).json({ success: true, message: `Année ${libelle} créée`, data: rows[0] });
  } catch (e) { next(e); }
};

/** PUT /annees-scolaires/:id — modifier ou (ré)activer une année : si statut='active',
 *  toutes les autres passent automatiquement en « archivée » (RG8). */
export const modifier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existant = await query(`SELECT * FROM annees_scolaires WHERE id=$1`, [id]);
    if (!existant.rows[0]) throw new AppError(404, 'Année scolaire introuvable');
    const d = { ...existant.rows[0], ...req.body };
    const doublon = await query(`SELECT 1 FROM annees_scolaires WHERE libelle = $1 AND id <> $2`, [d.libelle, id]);
    if (doublon.rows[0]) throw new AppError(409, `L'année ${d.libelle} existe déjà — choisissez un autre libellé.`);
    if (d.statut === 'active') await query(`UPDATE annees_scolaires SET statut='archivee' WHERE statut='active' AND id <> $1`, [id]); // RG8
    const { rows } = await query(
      `UPDATE annees_scolaires SET libelle=$1, date_debut=$2, date_fin=$3, total_cible=$4, statut=$5 WHERE id=$6 RETURNING *, total_cible::float8 AS total_cible`,
      [d.libelle, d.date_debut, d.date_fin, d.total_cible, d.statut, id]);
    res.json({ success: true, message: `Année ${d.libelle} mise à jour${d.statut === 'active' ? ' — elle est maintenant l\'année active' : ''}`, data: rows[0] });
  } catch (e) { next(e); }
};

/** DELETE /annees-scolaires/:id — impossible si des cotisations existent (archivez plutôt). */
export const supprimer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ref = await query(`SELECT COUNT(*)::int AS n FROM cotisations WHERE annee_id=$1`, [id]);
    if (ref.rows[0].n > 0) throw new AppError(409, 'Suppression impossible : des cotisations existent pour cette année (archivez-la plutôt).');
    const { rows } = await query(`DELETE FROM annees_scolaires WHERE id=$1 RETURNING libelle`, [id]);
    if (!rows[0]) throw new AppError(404, 'Année scolaire introuvable');
    res.json({ success: true, message: `Année ${rows[0].libelle} supprimée` });
  } catch (e) { next(e); }
};