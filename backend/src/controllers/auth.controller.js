import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';

const SECRET = process.env.AUTH_SECRET || 'cotiscola-secret-a-changer-en-production';
const DUREE = '30d'; // rester connecté 30 jours

/** Signe le token et le pose en cookie HttpOnly (marche aussi pour les PDF ouverts dans un onglet). */
function poserCookie(res, utilisateur) {
  const token = jwt.sign({ id: utilisateur.id, identifiant: utilisateur.identifiant, role: utilisateur.role }, SECRET, { expiresIn: DUREE });
  res.setHeader('Set-Cookie',
    `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
}

/** POST /auth/login — vérifie identifiant + mot de passe, ouvre la session. */
export const login = async (req, res, next) => {
  try {
    const { identifiant, mot_de_passe } = req.body;
    const { rows } = await query(`SELECT * FROM utilisateurs WHERE identifiant = $1 AND actif = TRUE`, [String(identifiant || '').trim().toLowerCase()]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(String(mot_de_passe || ''), u.mot_de_passe))) {
      throw new AppError(401, 'Identifiant ou mot de passe incorrect');
    }
    poserCookie(res, u);
    res.json({ success: true, message: `Bienvenue, ${u.nom_complet || u.identifiant} !`, data: { id: u.id, identifiant: u.identifiant, nom_complet: u.nom_complet, role: u.role } });
  } catch (e) { next(e); }
};

/** POST /auth/logout — ferme la session (supprime le cookie). */
export const logout = async (req, res) => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.json({ success: true, message: 'Déconnecté' });
};

/** GET /auth/me — infos du compte connecté. */
export const me = async (req, res) => {
  res.json({ success: true, data: req.utilisateur });
};