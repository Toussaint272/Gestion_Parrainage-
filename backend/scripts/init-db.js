// Crée la base et l'utilisateur si nécessaire, applique le schéma et les données de départ.
// Usage : npm run db:init  (dans backend/)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminUrl =
  process.env.ADMIN_DATABASE_URL ||
  "postgresql://postgres:2026@localhost:5432/postgres";
const dbUrl =
  process.env.DATABASE_URL ||
  "postgresql://cotisa1:cotisa1@localhost:5432/cotisations_db1";

const run = async () => {
  // ── 1. Connexion admin sur la base "postgres" : créer user + db ──
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin
    .query(`CREATE USER cotisa1 WITH PASSWORD 'cotisa1'`)
    .catch(() => console.log("· utilisateur cotisa1 déjà existant"));
  await admin
    .query(`CREATE DATABASE cotisations_db1 OWNER cotisa1`)
    .catch(() => console.log("· base cotisations_db1 déjà existante"));
  await admin.end();

  // ── 2. Connexion admin sur la base "cotisations_db1" : droits sur public ──
  const adminOnDb = new pg.Client({
    connectionString: adminUrl.replace(/\/postgres(\?.*)?$/, "/cotisations_db1"),
  });
  await adminOnDb.connect();
  await adminOnDb.query(`GRANT ALL ON SCHEMA public TO cotisa1`);
  await adminOnDb.query(`ALTER SCHEMA public OWNER TO cotisa1`);
  await adminOnDb.query(
    `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cotisa1`,
  );
  await adminOnDb.query(
    `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cotisa1`,
  );
  await adminOnDb.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cotisa1`,
  );
  await adminOnDb.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cotisa1`,
  );
  await adminOnDb.end();
  console.log("· droits sur le schéma public accordés à cotisa1");

  // ── 3. Connexion avec cotisa1 : exécution des scripts SQL ──
  const db = new pg.Client({ connectionString: dbUrl });
  await db.connect();
  for (const fichier of ["01_schema.sql", "02_views.sql", "03_seed.sql"]) {
    const sql = fs.readFileSync(
      path.join(__dirname, "..", "sql", fichier),
      "utf8",
    );
    await db.query(sql);
    console.log(`✔ ${fichier} appliqué`);
  }
  await db.end();
  console.log(
    "\n✅ Base de données prête : cotisations_db1 (données de démonstration chargées)",
  );
  process.exit(0);
};

run().catch((e) => {
  console.error("❌ Échec db:init :", e.message);
  process.exit(1);
});