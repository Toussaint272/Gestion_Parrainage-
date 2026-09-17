import { envoyerRecuParEmail, envoyerRapportParEmail } from '../services/email.service.js';
import { query } from '../config/db.js';
import { resoudreAnnee } from '../services/stats.service.js';
import { AppError } from '../utils/appError.js';

export const envoyerRecu = async (req, res, next) => {
  try { res.json({ success: true, ...(await envoyerRecuParEmail(req.params.id, req.body.email || null)) }); }
  catch (e) { next(e); }
};

export const envoyerRapport = async (req, res, next) => {
  try {
    const annee = await resoudreAnnee(req.body.annee_id);
    res.json({ success: true, ...(await envoyerRapportParEmail(annee.id, req.body.destinataire)) });
  } catch (e) { next(e); }
};

export const journal = async (req, res, next) => {
  try {
    const { statut } = req.query;
    const params = []; const where = [];
    if (statut) { params.push(statut); where.push(`l.statut = $${params.length}`); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await query(
      `SELECT l.*, c.noms_parents, a.libelle AS annee
         FROM emails_logs l
         LEFT JOIN cotisations c ON c.id = l.cotisation_id
         LEFT JOIN annees_scolaires a ON a.id = c.annee_id
        ${w} ORDER BY l.envoye_le DESC LIMIT 200`, params);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

// POST /emails/logs/:id/renvoyer — renvoie le reçu ou le rapport après un échec
export const renvoyer = async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM emails_logs WHERE id=$1`, [req.params.id]);
    const log = rows[0];
    if (!log) throw new AppError(404, 'Entrée du journal introuvable');
    if (log.type_document === 'recu' && log.cotisation_id) {
      return res.json({ success: true, ...(await envoyerRecuParEmail(log.cotisation_id, log.destinataire)) });
    }
    if (log.type_document === 'rapport') {
      const annee = await resoudreAnnee();
      return res.json({ success: true, ...(await envoyerRapportParEmail(annee.id, log.destinataire)) });
    }
    throw new AppError(422, 'Impossible de renvoyer cet email (référence manquante).');
  } catch (e) { next(e); }
};
