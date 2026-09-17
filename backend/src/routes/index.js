import { Router } from 'express';
import * as annees from '../controllers/annees.controller.js';
import * as cotisations from '../controllers/cotisations.controller.js';
import * as tableau from '../controllers/tableau.controller.js';
import * as bareme from '../controllers/bareme.controller.js';
import * as pdf from '../controllers/pdf.controller.js';
import * as emails from '../controllers/emails.controller.js';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { valider } from '../middlewares/validate.js';
import { anneeSchema, cotisationSchema, baremeSchema, emailRecuSchema, emailRapportSchema } from '../validators/schemas.js';

const r = Router();

/* Connexion — SEULES routes publiques de l'application */
r.post('/auth/login', auth.login);
r.post('/auth/logout', auth.logout);

/* Toutes les routes ci-dessous exigent une session valide */
r.use(requireAuth);

r.get('/auth/me', auth.me);

/* Années scolaires */
r.get('/annees-scolaires', annees.lister);
r.post('/annees-scolaires', valider(anneeSchema), annees.creer);
r.put('/annees-scolaires/:id', valider(anneeSchema.partial()), annees.modifier);
r.delete('/annees-scolaires/:id', annees.supprimer);

/* Cotisations — LA TABLE UNIQUE (= la feuille) */
r.get('/cotisations/:anneeId?', cotisations.lister);
r.post('/cotisations', valider(cotisationSchema), cotisations.creer);
r.put('/cotisations/:id', valider(cotisationSchema.partial()), cotisations.modifier);
r.delete('/cotisations/:id', cotisations.supprimer);

/* Barème des frais + calcul auto (transferts) */
r.get('/bareme', bareme.lister);
r.post('/bareme', valider(baremeSchema), bareme.enregistrer);
r.delete('/bareme/:id', bareme.supprimer);
r.get('/bareme/calcul', bareme.calculer);

/* Statistiques (tableau de bord) */
r.get('/statistiques/:anneeId?', tableau.statistiques);

/* PDF */
r.get('/pdf/recu/:id', pdf.recu);
r.post('/pdf/rapport', pdf.rapport);
r.get('/pdf/rapport', pdf.rapport);

/* Emails (PDF en pièce jointe) */
r.post('/emails/recu/:id', valider(emailRecuSchema), emails.envoyerRecu);
r.post('/emails/rapport', valider(emailRapportSchema), emails.envoyerRapport);
r.get('/emails/logs', emails.journal);
r.post('/emails/logs/:id/renvoyer', emails.renvoyer);

export default r;