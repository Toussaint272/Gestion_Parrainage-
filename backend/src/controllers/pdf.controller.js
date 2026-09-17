import { genererRecu, genererRapport } from '../services/pdf.service.js';
import { resoudreAnnee } from '../services/stats.service.js';

// Puppeteer renvoie un Uint8Array : on le convertit en Buffer pour un envoi binaire propre.
const binaire = (buffer) => Buffer.from(buffer);

export const recu = async (req, res, next) => {
  try {
    const { buffer, data } = await genererRecu(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-${data.numero}.pdf"`);
    res.send(binaire(buffer));
  } catch (e) { next(e); }
};

export const rapport = async (req, res, next) => {
  try {
    const annee = await resoudreAnnee(req.body.annee_id || req.query.annee_id);
    const { buffer, data } = await genererRapport(annee.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-cotisations-${data.annee}.pdf"`);
    res.send(binaire(buffer));
  } catch (e) { next(e); }
};
