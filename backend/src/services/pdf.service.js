import puppeteer from 'puppeteer';
import { query } from '../config/db.js';
import { numeroRecu } from '../utils/numeroRecu.js';
import { recuHtml } from '../templates/recu.template.js';
import { rapportHtml } from '../templates/rapport.template.js';
import { totauxAnnee } from './stats.service.js';
import { AppError } from '../utils/appError.js';

let navigateur = null;
async function getNavigateur() {
  if (!navigateur) {
    navigateur = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  }
  return navigateur;
}

async function rendre(html, opts) {
  const nav = await getNavigateur();
  const page = await nav.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({ format: opts.format || 'A4', landscape: !!opts.landscape, printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  } finally { await page.close(); }
}

/** Rend un gabarit HTML en PDF (Buffer) — relance le navigateur une fois s'il a crashé. */
export async function htmlVersPdf(html, opts = {}) {
  try {
    return await rendre(html, opts);
  } catch (e) {
    if (navigateur) { try { await navigateur.close(); } catch { /* déjà mort */ } navigateur = null; }
    return await rendre(html, opts);
  }
}

const etab = () => ({
  nom: process.env.ETAB_NOM || 'Établissement Scolaire',
  adresse: process.env.ETAB_ADRESSE || 'Madagascar',
  contact: process.env.ETAB_CONTACT || '',
});
const maintenant = () => new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** Reçu PDF d'une ligne de cotisation. */
export async function genererRecu(cotisationId) {
  const { rows } = await query(
    `SELECT c.*, c.sommes::float8 AS sommes, c.transferts::float8 AS transferts, a.libelle AS annee
       FROM cotisations c JOIN annees_scolaires a ON a.id = c.annee_id
      WHERE c.id = $1`, [cotisationId]);
  const c = rows[0];
  if (!c) throw new AppError(404, 'Cotisation introuvable');
  const data = {
    numero: numeroRecu(c.annee, c.id), annee: c.annee,
    date_paiement: new Date(c.cree_le).toLocaleDateString('fr-FR'),
    noms_parents: c.noms_parents, noms_enfants: c.noms_enfants || '—',
    sommes: +c.sommes, transferts: +c.transferts,
    email: c.email,
    etab: etab(), genere_le: maintenant(),
  };
  return { buffer: await htmlVersPdf(recuHtml(data), { format: 'A5', landscape: true }), data };
}

/** Rapport annuel PDF : la liste complète (= la feuille) + totaux — format A4 portrait. */
export async function genererRapport(anneeId) {
  const { rows } = await query(
    `SELECT noms_parents, COALESCE(noms_enfants, '—') AS noms_enfants,
            sommes::float8 AS sommes, transferts::float8 AS transferts, transfert_auto
       FROM cotisations WHERE annee_id = $1 ORDER BY id`, [anneeId]);
  const totaux = await totauxAnnee(anneeId);
  const data = { lignes: rows, totaux, annee: totaux.annee, etab: etab(), genere_le: maintenant() };
  return { buffer: await htmlVersPdf(rapportHtml(data), { format: 'A4' }), data };
}