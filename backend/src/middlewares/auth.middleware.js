import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';

const SECRET = process.env.AUTH_SECRET || 'cotiscola-secret-a-changer-en-production';

/** Protège toutes les routes API : session par cookie HttpOnly (ou Authorization: Bearer). */
export function requireAuth(req, res, next) {
  let token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) {
    const cookie = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith('token='));
    if (cookie) token = cookie.slice(6);
  }
  if (!token) throw new AppError(401, 'Session expirée — connectez-vous à nouveau');
  try {
    req.utilisateur = jwt.verify(token, SECRET);
    next();
  } catch {
    throw new AppError(401, 'Session expirée — connectez-vous à nouveau');
  }
}