import axios from 'axios';

// Base relative : le serveur Vite proxifie /api vers le backend Express (port 5000).
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}`,
  timeout: 60000,
});
// Session expirée → retour à la page de connexion (sauf sur la requête de login elle-même).
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e?.response?.status === 401 && !String(e?.config?.url || '').includes('/auth/')) {
      localStorage.removeItem('cotiscola_user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(e);
  },
);

export const get = (url, cfg) => api.get(url, cfg).then((r) => r.data);
export const post = (url, body, cfg) => api.post(url, body, cfg).then((r) => r.data);
export const put = (url, body, cfg) => api.put(url, body, cfg).then((r) => r.data);
export const del = (url, cfg) => api.delete(url, cfg).then((r) => r.data);

/** Utilisateur connecté (infos d'affichage seulement — la vraie session est le cookie HttpOnly). */
export const utilisateurCourant = () => {
  try { return JSON.parse(localStorage.getItem('cotiscola_user') || 'null'); } catch { return null; }
};
export const deconnexion = () => {
  localStorage.removeItem('cotiscola_user');
  return post('/auth/logout').catch(() => { /* le cookie est purgé quand même côté client */ });
};

/** Téléchargement direct (PDF) via une nouvelle fenêtre. */
export const urlPdf = (chemin) => `${api.defaults.baseURL}${chemin}`;

/** Extrait un message d'erreur lisible de la réponse de l'API. */
export const messageErreur = (e, defaut = 'Une erreur est survenue') => {
  if (e?.response?.data?.error?.message) return e.response.data.error.message;
  if (e?.code === 'ECONNABORTED') return 'Délai dépassé — réessayez';
  if (e?.message === 'Network Error') return 'API inaccessible : démarrez le backend (voir README)';
  return defaut;
};

export const ar = (n) => `${Number(n ?? 0).toLocaleString('fr-FR')} Ar`;
export const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
export const MODES = [
  ['especes', 'Espèces'], ['mvola', 'MVola'], ['orange_money', 'Orange Money'],
  ['airtel_money', 'Airtel Money'], ['virement', 'Virement'], ['autre', 'Autre'],
];
export const modeLabel = (m) => (MODES.find(([v]) => v === m) || [null, m])[1];