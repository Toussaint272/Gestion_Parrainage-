import { getTransporter, mailFrom } from '../config/smtp.js';
import { query } from '../config/db.js';
import { genererRecu, genererRapport } from './pdf.service.js';
import { emailRecu, emailRapport } from '../templates/email.template.js';
import { AppError } from '../utils/appError.js';

async function envoyer(message) {
  const t = getTransporter();
  if (!t) throw new AppError(503, 'SMTP non configuré : renseignez SMTP_HOST / SMTP_USER / SMTP_PASS dans backend/.env (voir Annexe A de la conception).');
  return t.sendMail(message);
}

async function journaliser({ cotisation_id = null, destinataire, type, sujet, statut, erreur = null }) {
  await query(
    `INSERT INTO emails_logs (cotisation_id, destinataire, type_document, sujet, statut, erreur)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [cotisation_id, destinataire, type, sujet, statut, erreur]);
}

/** Génère le reçu PDF de la cotisation et l'envoie par email.
 *  `emailOverride` : permet d'indiquer/corriger l'adresse au moment de l'envoi (elle est alors enregistrée). */
export async function envoyerRecuParEmail(cotisationId, emailOverride = null) {
  const { buffer, data } = await genererRecu(cotisationId);
  const destinataire = (emailOverride || '').trim() || data.email;
  if (!destinataire) throw new AppError(422, `Aucun email connu pour ${data.noms_parents} — indiquez-le pour l'envoi.`);
  const sujet = `Reçu de cotisation ${data.numero} — Année ${data.annee}`;
  try {
    await envoyer({
      from: mailFrom(), to: destinataire, subject: sujet,
      html: emailRecu(data),
      attachments: [{ filename: `recu-${data.numero}.pdf`, content: buffer, contentType: 'application/pdf' }],
    });
    if (!data.email || data.email !== destinataire) {
      await query(`UPDATE cotisations SET email = $1 WHERE id = $2`, [destinataire, cotisationId]);
    }
    await journaliser({ cotisation_id: cotisationId, destinataire, type: 'recu', sujet, statut: 'envoye' });
    return { message: `Reçu ${data.numero} envoyé à ${destinataire}`, destinataire };
  } catch (e) {
    await journaliser({ cotisation_id: cotisationId, destinataire, type: 'recu', sujet, statut: 'echec', erreur: e.message });
    throw new AppError(502, `Échec de l'envoi SMTP : ${e.message}`);
  }
}

/** Génère le rapport annuel PDF et l'envoie au destinataire indiqué. */
export async function envoyerRapportParEmail(anneeId, destinataire) {
  const { buffer, data } = await genererRapport(anneeId);
  const sujet = `Rapport des cotisations — Année ${data.annee}`;
  try {
    await envoyer({
      from: mailFrom(), to: destinataire, subject: sujet,
      html: emailRapport(data),
      attachments: [{ filename: `rapport-cotisations-${data.annee}.pdf`, content: buffer, contentType: 'application/pdf' }],
    });
    await journaliser({ destinataire, type: 'rapport', sujet, statut: 'envoye' });
    return { message: `Rapport ${data.annee} envoyé à ${destinataire}`, destinataire };
  } catch (e) {
    await journaliser({ destinataire, type: 'rapport', sujet, statut: 'echec', erreur: e.message });
    throw new AppError(502, `Échec de l'envoi SMTP : ${e.message}`);
  }
}
