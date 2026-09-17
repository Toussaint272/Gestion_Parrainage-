// Import du classeur Google Sheets (exporté en .xlsx) — version v2 (table unique cotisations).
// Usage : node scripts/import-excel.js <classeur.xlsx> [libellé année, ex: 26-27]
// Hypothèses : onglet = année, colonnes A:N° B:Parents C:Enfants D:Sommes E:Transferts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import pg from 'pg';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [fichier, libelleAnne] = process.argv.slice(2);
if (!fichier) { console.error('Usage : node scripts/import-excel.js <classeur.xlsx> [libellé année, ex: 26-27]'); process.exit(1); }

const nb = (x) => +String(x ?? '0').replace(/[^\d.-]/g, '') || 0;

const run = async () => {
  const wb = XLSX.readFile(path.resolve(fichier));
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://cotisa:cotisa@localhost:5432/cotisations_db' });
  await db.connect();
  let totalSommes = 0, totalFrais = 0;

  for (const nomOnglet of wb.SheetNames) {
    const annee = libelleAnne || nomOnglet.trim();
    const an = await db.query(
      `INSERT INTO annees_scolaires (libelle, date_debut, date_fin, statut)
       VALUES ($1, ($2 || '-09-01')::date, (($2::int + 1) || '-07-31')::date, 'archivee')
       ON CONFLICT (libelle) DO UPDATE SET date_debut = EXCLUDED.date_debut
       RETURNING id`, [annee, `20${annee.slice(0, 2)}`]);
    const anneeId = an.rows[0].id;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[nomOnglet], { header: ['num', 'parent', 'enfants', 'sommes', 'transferts'], range: 1 });

    for (const r of rows) {
      if (!r.parent || /total|reste/i.test(String(r.parent))) continue;
      const nomsParents = String(r.parent).replace(/\s*\(.+?\)\s*$/, '').trim();  // retire « (F/tsoa) »
      const nomsEnfants = String(r.enfants || '').trim();
      const sommes = nb(r.sommes);
      if (sommes <= 0) continue;
      const transferts = nb(r.transferts);
      await db.query(
        `INSERT INTO cotisations (annee_id, noms_parents, noms_enfants, sommes, transferts, transfert_auto)
         VALUES ($1, $2, $3, $4, $5, FALSE)`, [anneeId, nomsParents, nomsEnfants, sommes, transferts]);
      totalSommes += sommes; totalFrais += transferts;
    }
    console.log(`✔ Onglet « ${nomOnglet} » importé (année ${annee})`);
  }
  await db.end();
  console.log(`\n✅ Import terminé — Sommes : ${totalSommes.toLocaleString('fr-FR')} Ar · Transferts : ${totalFrais.toLocaleString('fr-FR')} Ar`);
  console.log('   Comparez ces totaux à la feuille pour valider l\'import (contrôle d\'intégrité).');
};
run().catch((e) => { console.error('❌ Échec import :', e.message); process.exit(1); });
