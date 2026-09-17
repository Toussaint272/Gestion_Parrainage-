import { z } from 'zod';

const num = z.coerce.number();
const positif = num.positive();

export const anneeSchema = z.object({
  libelle: z.string().min(4).max(7),
  date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format AAAA-MM-JJ attendu'),
  date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format AAAA-MM-JJ attendu'),
  total_cible: z.coerce.number().min(0).default(0),
  statut: z.enum(['active', 'archivee']).optional(),
});

// ===== LA SEULE ENTITÉ MÉTIER (miroir de la feuille) =====
export const cotisationSchema = z.object({
  annee_id: z.coerce.number().int().positive().optional(),
  noms_parents: z.string().min(2, 'Nom du parent trop court').max(150),
  noms_enfants: z.string().max(300).optional().nullable().or(z.literal('')),
  sommes: z.coerce.number().positive('La somme doit être positive'),
  mode_paiement: z.enum(['mvola', 'especes']).default('mvola'), // mvola → frais auto ; especes → aucun frais
  email: z.string().email('Email invalide').max(160).optional().nullable().or(z.literal('')),
});

export const baremeSchema = z.object({
  operateur: z.string().min(2).max(20).default('mvola'),
  type_frais: z.enum(['envoi', 'retrait']),
  tranche_min: positif,
  tranche_max: positif,
  frais: num.min(0),
}).refine((b) => b.tranche_max >= b.tranche_min, { message: 'tranche_max doit être ≥ tranche_min', path: ['tranche_max'] });

export const emailRecuSchema = z.object({
  email: z.string().email('Email invalide').optional().nullable().or(z.literal('')),
});

export const emailRapportSchema = z.object({
  annee_id: z.coerce.number().int().positive().optional(),
  destinataire: z.string().email('Email du destinataire invalide'),
});