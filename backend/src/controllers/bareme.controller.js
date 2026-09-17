import { query } from '../config/db.js';
import { calculerFrais } from '../services/frais.service.js';
import { AppError } from '../utils/appError.js';

export const lister = async (req, res, next) => {
  try {
    const operateur = req.query.operateur || 'mvola';
    const { rows } = await query(
      `SELECT id, operateur, type_frais, tranche_min::float8 AS tranche_min, tranche_max::float8 AS tranche_max, frais::float8 AS frais
         FROM bareme_frais WHERE operateur = $1 ORDER BY type_frais, tranche_min`, [operateur]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

export const enregistrer = async (req, res, next) => {
  try {
    const { operateur, type_frais, tranche_min, tranche_max, frais } = req.body;
    const { rows } = await query(
      `INSERT INTO bareme_frais (operateur, type_frais, tranche_min, tranche_max, frais)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (operateur, type_frais, tranche_min)
       DO UPDATE SET tranche_max = EXCLUDED.tranche_max, frais = EXCLUDED.frais
       RETURNING *`, [operateur, type_frais, tranche_min, tranche_max, frais]);
    res.status(201).json({ success: true, message: 'Tranche enregistrée', data: rows[0] });
  } catch (e) { next(e); }
};

export const supprimer = async (req, res, next) => {
  try {
    const { rows } = await query(`DELETE FROM bareme_frais WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Tranche introuvable');
    res.json({ success: true, message: 'Tranche supprimée' });
  } catch (e) { next(e); }
};

// GET /bareme/calcul?montant=300000&operateur=mvola&types=envoi,retrait — calcul auto pour le formulaire
export const calculer = async (req, res, next) => {
  try {
    const montant = +(req.query.montant || 0);
    if (!montant || montant <= 0) throw new AppError(422, 'Paramètre « montant » requis (nombre positif).');
    const types = (req.query.types || 'envoi,retrait').split(',').filter((t) => ['envoi', 'retrait'].includes(t));
    const data = await calculerFrais({ montant, operateur: req.query.operateur || 'mvola', types });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
