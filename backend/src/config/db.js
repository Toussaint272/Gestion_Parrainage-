import pg from 'pg';
import 'dotenv/config';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: { rejectUnauthorized: false },  // ← ZAVA-DEHIBE HO AN'NY NEON
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => console.error('[PG] erreur pool :', err.message));

/** Exécute une requête SQL paramétrée (protection injection intégrée). */
export const query = (text, params) => pool.query(text, params);

/** Récupère l'année scolaire active (utilisé quand annee_id n'est pas fourni). */
export async function anneeActive() {
  const { rows } = await query(`SELECT * FROM annees_scolaires WHERE statut='active' ORDER BY id LIMIT 1`);
  return rows[0] || null;
}