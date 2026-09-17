-- ============================================================
-- CotiScola v2 — Schéma SIMPLIFIÉ (miroir de la feuille Excel)
-- 1 table de données : cotisations
-- + 3 tables techniques : annees_scolaires, bareme_frais, emails_logs
-- ============================================================

-- Nettoyage des objets v1 (ancienne structure multi-tables) si présents
DROP VIEW   IF EXISTS v_tableau_annuel;
DROP TABLE  IF EXISTS utilisateurs CASCADE;
DROP TABLE  IF EXISTS emails_logs   CASCADE;
DROP TABLE  IF EXISTS paiements     CASCADE;
DROP TABLE  IF EXISTS enfants       CASCADE;
DROP TABLE  IF EXISTS parents       CASCADE;

-- Table technique : années scolaires (= les onglets de la feuille)
CREATE TABLE IF NOT EXISTS annees_scolaires (
    id           SERIAL        PRIMARY KEY,
    libelle      VARCHAR(7)    NOT NULL UNIQUE,            -- « 26-27 »
    date_debut   DATE          NOT NULL,
    date_fin     DATE          NOT NULL,
    total_cible  NUMERIC(12,2) NOT NULL DEFAULT 0,         -- montant cible FIXE (ex. 7 173 808)
    statut       VARCHAR(10)   NOT NULL DEFAULT 'active',
    cree_le      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ⭐ TABLE UNIQUE = une ligne de la feuille (N° automatique)
CREATE TABLE IF NOT EXISTS cotisations (
    id             SERIAL        PRIMARY KEY,               -- N° automatique
    annee_id       INT           NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    noms_parents   VARCHAR(150)  NOT NULL,                  -- « Noms des Parents »
    noms_enfants   VARCHAR(300),                            -- « Noms des Enfants » (virgules)
    sommes         NUMERIC(12,2) NOT NULL CHECK (sommes > 0),   -- « Sommes »
    transferts     NUMERIC(12,2) NOT NULL DEFAULT 0,        -- « Transferts » — AUTO depuis sommes (barème)
    transfert_auto BOOLEAN       NOT NULL DEFAULT TRUE,     -- false = valeur importée de la feuille
    email          VARCHAR(160),                            -- optionnel (envoi du reçu PDF)
    cree_le        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cotisations_annee ON cotisations(annee_id);

-- Table technique : barème des frais (MVola — envoi + retrait)
CREATE TABLE IF NOT EXISTS bareme_frais (
    id          SERIAL        PRIMARY KEY,
    operateur   VARCHAR(20)   NOT NULL DEFAULT 'mvola',
    type_frais  VARCHAR(10)   NOT NULL,                     -- envoi | retrait
    tranche_min NUMERIC(12,2) NOT NULL,
    tranche_max NUMERIC(12,2) NOT NULL,
    frais       NUMERIC(12,2) NOT NULL,
    UNIQUE (operateur, type_frais, tranche_min)
);

-- Table technique : journal des emails
CREATE TABLE IF NOT EXISTS emails_logs (
    id            SERIAL       PRIMARY KEY,
    cotisation_id INT          REFERENCES cotisations(id) ON DELETE SET NULL,
    destinataire  VARCHAR(160) NOT NULL,
    type_document VARCHAR(20)  NOT NULL,                     -- recu | rapport
    sujet         VARCHAR(200) NOT NULL,
    statut        VARCHAR(10)  NOT NULL,                     -- envoye | echec
    erreur        TEXT,
    envoye_le     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- Migration automatique (bases créées avant l'ajout du mode de paiement)
ALTER TABLE cotisations ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(10) NOT NULL DEFAULT 'mvola';


-- ============================================================
-- Authentification (page de connexion) : comptes utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id            SERIAL        PRIMARY KEY,
    identifiant   VARCHAR(60)   NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(100)  NOT NULL,            -- hash bcrypt (jamais en clair)
    nom_complet   VARCHAR(120)  NOT NULL DEFAULT '',
    role          VARCHAR(20)   NOT NULL DEFAULT 'admin',
    actif         BOOLEAN       NOT NULL DEFAULT TRUE,
    cree_le       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);