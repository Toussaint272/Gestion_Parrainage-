import { AppError } from '../utils/appError.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route inconnue : ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: { code: 'APP_ERROR', message: err.message, details: err.details } });
  }
  if (err?.name === 'ZodError') {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION', message: 'Données invalides', details: err.flatten().fieldErrors } });
  }
  if (err?.code === '23503') return res.status(409).json({ success:false, error:{ code:'FK', message:'Opération impossible : cet élément est référencé ailleurs (paiement existant ?).' } });
  if (err?.code === '23505') return res.status(409).json({ success:false, error:{ code:'UNIQUE', message:'Doublon : cet enregistrement existe déjà.' } });
  if (err?.code === '23502') return res.status(422).json({ success:false, error:{ code:'NOT_NULL', message:'Un champ obligatoire est manquant.' } });
  console.error('[ERREUR]', err);
  res.status(500).json({ success: false, error: { code: 'SERVER', message: 'Erreur interne du serveur' } });
}
