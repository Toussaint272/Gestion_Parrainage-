import { query, anneeActive } from '../config/db.js';
import { calculerFrais } from '../services/frais.service.js';
import { AppError } from '../utils/appError.js';

async function resoudreAnnee(anneeId) {
  if (anneeId) return { id: +anneeId };
  const a = await anneeActive();
  if (!a) throw new AppError(422, 'Aucune année scolaire active — créez-en une dans les Paramètres.');
  return a;
}

/**
 * Transferts selon le MODE choisi :
 *  - « mvola »   → frais d'envoi + retrait du barème, arrondis au millier supérieur (RG9-RG10)
 *  - « especes » → 0 Ar (aucun frais)
 */
async function calculerTransferts(sommes, mode) {
  if (mode === 'especes') return { valeur: 0 };
  try {
    const calc = await calculerFrais({ montant: sommes, types: ['envoi', 'retrait'] });
    return { valeur: calc.frais_total };
  } catch (e) {
    throw new AppError(422, `Impossible de calculer les transferts pour ${Number(sommes).toLocaleString('fr-FR')} Ar : ${e.message}`);
  }
}

/** GET /cotisations — LA LISTE (= la feuille) + totaux + reste. */
export const lister = async (req, res, next) => {
  try {
    const annee = await resoudreAnnee(req.params.anneeId || req.query.annee_id);
    const search = (req.query.search || '').trim();
    const params = [annee.id];
    let where = '';
    if (search) { params.push(`%${search}%`); where = `AND (c.noms_parents ILIKE $${params.length} OR c.noms_enfants ILIKE $${params.length})`; }
    const { rows } = await query(
      `SELECT c.id, c.noms_parents, c.noms_enfants, c.sommes::float8 AS sommes,
              c.transferts::float8 AS transferts, c.transfert_auto, c.mode_paiement, c.email,
              c.cree_le::date AS date_saisie
         FROM cotisations c
        WHERE c.annee_id = $1 ${where}
        ORDER BY c.id`, params);
    const t = await query(
      `SELECT COALESCE(SUM(sommes), 0)::float8 AS sommes,
              COALESCE(SUM(transferts), 0)::float8 AS transferts,
              COUNT(*)::int AS nb
         FROM cotisations WHERE annee_id = $1`, [annee.id]);
    const cible = await query(`SELECT total_cible::float8 AS total_cible, libelle FROM annees_scolaires WHERE id = $1`, [annee.id]);
    const totaux = {
      cible: cible.rows[0].total_cible,
      sommes: t.rows[0].sommes,
      transferts: t.rows[0].transferts,
      nb: t.rows[0].nb,
      reste: cible.rows[0].total_cible - (t.rows[0].sommes + t.rows[0].transferts), // RG4
    };
    res.json({ success: true, data: { annee_id: annee.id, annee: cible.rows[0].libelle, lignes: rows, totaux } });
  } catch (e) { next(e); }
};

/** POST /cotisations — ＋ Ajouter : mode (MVola/Espèces), Noms des Parents, Noms des Enfants, Sommes.
 *  N° automatique. Transferts : calculés automatiquement si MVola, à 0 si Espèces. */
export const creer = async (req, res, next) => {
  try {
    const { annee_id, noms_parents, noms_enfants, sommes, email, mode_paiement } = req.body;
    const annee = await resoudreAnnee(annee_id);
    const t = await calculerTransferts(sommes, mode_paiement);
    const { rows } = await query(
      `INSERT INTO cotisations (annee_id, noms_parents, noms_enfants, sommes, transferts, transfert_auto, mode_paiement, email)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)
       RETURNING *, sommes::float8 AS sommes, transferts::float8 AS transferts`,
      [annee.id, noms_parents, noms_enfants || null, sommes, t.valeur, mode_paiement, email || null]);
    const message = mode_paiement === 'especes'
      ? `${noms_parents} ajouté — paiement en espèces (aucun frais de transfert)`
      : `${noms_parents} ajouté — transferts calculés automatiquement : ${t.valeur.toLocaleString('fr-FR')} Ar`;
    res.status(201).json({ success: true, message, data: rows[0] });
  } catch (e) { next(e); }
};

/** PUT /cotisations/:id — modifier :
 *  - mode Espèces            → transferts à 0 ;
 *  - mode MVola + somme changée (ou passage Espèces → MVola) → recalcul automatique ;
 *  - sinon                   → transferts conservés. */
export const modifier = async (req, res, next) => {
  try {
    const ancien = (await query(`SELECT * FROM cotisations WHERE id = $1`, [req.params.id])).rows[0];
    if (!ancien) throw new AppError(404, 'Ligne introuvable');
    const m = { ...ancien, ...req.body, sommes: +(req.body.sommes ?? ancien.sommes) };

    let transferts;
    if (m.mode_paiement === 'especes') {
      transferts = 0;                                                 // espèces → aucun frais
    } else if (m.sommes !== +ancien.sommes || ancien.mode_paiement !== 'mvola') {
      transferts = (await calculerTransferts(m.sommes, 'mvola')).valeur; // recalcul auto
    } else {
      transferts = +ancien.transferts;                                // inchangé
    }

    const { rows } = await query(
      `UPDATE cotisations
          SET noms_parents = $1, noms_enfants = $2, sommes = $3, transferts = $4,
              transfert_auto = TRUE, mode_paiement = $5, email = $6
        WHERE id = $7
        RETURNING *, sommes::float8 AS sommes, transferts::float8 AS transferts`,
      [m.noms_parents, m.noms_enfants || null, m.sommes, transferts, m.mode_paiement, m.email || null, req.params.id]);
    const message = m.mode_paiement === 'especes'
      ? 'Ligne modifiée — paiement en espèces (aucun frais)'
      : 'Ligne modifiée — transferts recalculés automatiquement';
    res.json({ success: true, message, data: rows[0] });
  } catch (e) { next(e); }
};

/** DELETE /cotisations/:id */
export const supprimer = async (req, res, next) => {
  try {
    const { rows } = await query(`DELETE FROM cotisations WHERE id = $1 RETURNING noms_parents`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Ligne introuvable');
    res.json({ success: true, message: `${rows[0].noms_parents} supprimé — totaux recalculés` });
  } catch (e) { next(e); }
};