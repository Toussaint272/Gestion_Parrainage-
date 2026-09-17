-- ============================================================
-- Données de départ v3 : années + BARÈME MVOLA OFFICIEL (captures)
--   + règle d'arrondi : somme (envoi + retrait) TOUJOURS arrondie
--   au millier supérieur (1 000 → 2 000 · 2 000 → 3 000 · 6 000 → 7 000…)
-- Démo = la feuille 26-27 : Sommes 6 930 000 · Transferts 171 000
--   Cible 7 173 808 · Reste 72 808
-- ============================================================

INSERT INTO annees_scolaires (libelle, date_debut, date_fin, total_cible, statut) VALUES
  ('23-24', '2023-09-01', '2024-07-31', 0,       'archivee'),
  ('24-25', '2024-09-01', '2025-07-31', 0,       'archivee'),
  ('25-26', '2025-09-01', '2026-07-31', 0,       'archivee'),
  ('26-27', '2026-09-01', '2027-07-31', 7173808, 'active')
ON CONFLICT (libelle) DO NOTHING;

-- ⚠️ On REMPLACE le barème MVola à chaque exécution (mise à jour des tarifs
-- sans toucher à vos cotisations) — « npm run db:init » recharge tout ça.
DELETE FROM bareme_frais WHERE operateur = 'mvola';

-- Barème MVola OFFICIEL (captures « Tableau des tarifs MVola ») :
-- 25 tranches de 1 001 à 17 000 000 Ar. Le dépôt est gratuit.
INSERT INTO bareme_frais (operateur, type_frais, tranche_min, tranche_max, frais) VALUES
  ('mvola','envoi',        1001,      5000,    70),  ('mvola','retrait',        1001,      5000,   150),
  ('mvola','envoi',     5001,     10000,   150),  ('mvola','retrait',     5001,     10000,   275),
  ('mvola','envoi',    10001,     20000,   250),  ('mvola','retrait',    10001,     20000,   550),
  ('mvola','envoi',    20001,     25000,   250),  ('mvola','retrait',    20001,     25000,   650),
  ('mvola','envoi',    25001,     50000,   500),  ('mvola','retrait',    25001,     50000,  1300),
  ('mvola','envoi',    50001,    100000,  1000),  ('mvola','retrait',    50001,    100000,  1900),
  ('mvola','envoi',   100001,    250000,  1900),  ('mvola','retrait',   100001,    250000,  3400),
  ('mvola','envoi',   250001,    500000,  1900),  ('mvola','retrait',   250001,    500000,  4700),
  ('mvola','envoi',   500001,   1000000,  3200),  ('mvola','retrait',   500001,   1000000,  8800),
  ('mvola','envoi',  1000001,   2000000,  3800),  ('mvola','retrait',  1000001,   2000000, 14700),
  ('mvola','envoi',  2000001,   3000000,  5000),  ('mvola','retrait',  2000001,   3000000, 19600),
  ('mvola','envoi',  3000001,   4000000,  6300),  ('mvola','retrait',  3000001,   4000000, 24500),
  ('mvola','envoi',  4000001,   5000000,  7500),  ('mvola','retrait',  4000001,   5000000, 29400),
  ('mvola','envoi',  5000001,   6000000,  9400),  ('mvola','retrait',  5000001,   6000000, 34300),
  ('mvola','envoi',  6000001,   7000000, 10700),  ('mvola','retrait',  6000001,   7000000, 39200),
  ('mvola','envoi',  7000001,   8000000, 12500),  ('mvola','retrait',  7000001,   8000000, 44100),
  ('mvola','envoi',  8000001,   9000000, 14400),  ('mvola','retrait',  8000001,   9000000, 49000),
  ('mvola','envoi',  9000001,  10000000, 15700),  ('mvola','retrait',  9000001,  10000000, 53900),
  ('mvola','envoi', 10000001,  11000000, 17500),  ('mvola','retrait', 10000001,  11000000, 59000),
  ('mvola','envoi', 11000001,  12000000, 18800),  ('mvola','retrait', 11000001,  12000000, 64000),
  ('mvola','envoi', 12000001,  13000000, 20000),  ('mvola','retrait', 12000001,  13000000, 69000),
  ('mvola','envoi', 13000001,  14000000, 21300),  ('mvola','retrait', 13000001,  14000000, 74000),
  ('mvola','envoi', 14000001,  15000000, 23200),  ('mvola','retrait', 14000001,  15000000, 79000),
  ('mvola','envoi', 15000001,  16000000, 25000),  ('mvola','retrait', 15000001,  16000000, 84000),
  ('mvola','envoi', 16000001,  17000000, 26300),  ('mvola','retrait', 16000001,  17000000, 89000);

-- Démo : les lignes de la feuille 26-27 (transferts importés tels quels,
-- total 171 000 — les nouvelles saisies utiliseront le barème ci-dessus)
INSERT INTO cotisations (annee_id, noms_parents, noms_enfants, sommes, transferts, transfert_auto, email)
SELECT 4, t.parents, t.enfants, t.sommes, t.transferts, FALSE, t.email FROM (VALUES
  ('Mme Marie Louise',  'Bosco, Jean Luc, Emile',          300000,     0, 'marie.louise@demo.mg'),
  ('Mr Liva',           'Sonia, Angela',                   300000,     0, NULL),
  ('Sr Aimée Cécile',   'Ando, Fara',                      300000,     0, 'aimee.cecile@demo.mg'),
  ('Mme Lola',          'Théo, Gabriel, Prisca, Frederic', 300000,     0, NULL),
  ('Mme Cyriaque',      'Christian, Diary, Bienvenu',      650000, 48000, 'cyriaque@demo.mg'),
  ('Mme Hanta',         'Yorik',                           300000,     0, 'hanta@demo.mg'),
  ('Mr Hery',           'Andrelina',                       200000,     0, NULL),
  ('Mme Rasy',          'Parfait, Mika',                   250000,     0, 'rasy@demo.mg'),
  ('Mme Zazà',          'Florence',                        300000,     0, NULL),
  ('Mme Sahondra',      'Rebecca',                         100000,     0, 'sahondra@demo.mg'),
  ('Sr Jeanne Lucie',   'Nicole, Anja',                    300000,     0, NULL),
  ('Mme Nory',          'Sitraka, Tino, Johny',            300000,     0, 'nory@demo.mg'),
  ('Sr Aimée Cécile',   'Tatiana, Laurencia, Elinah',      450000, 10000, 'aimee.cecile@demo.mg'),
  ('Mr Léonard',        'Mendrika, Faly',                  500000, 48000, NULL),
  ('Bon Secours',       'Justin, Marolahy, Zoentsoa',       80000, 17000, 'bonsecours@demo.mg'),
  ('Sr Jeanne Lucie',   'Sonia, Tiavina',                  400000,     0, NULL),
  ('Mme Rasoa',         'Thérèse',                         200000,     0, NULL),
  ('Mme Ralala',        'William, Françoise',              500000, 48000, 'ralala@demo.mg'),
  ('Mme Tapasike',      'Stanny',                          200000,     0, NULL),
  ('Mr Rambola',        'Xavier',                          200000,     0, NULL),
  ('Mr Bolo',           'Mamy, Volala',                    200000,     0, NULL),
  ('Mr Lalaina',        'Francia',                         300000,     0, 'lalaina@demo.mg'),
  ('Mme Viviane',       'Alida, Bernardo',                 300000,     0, NULL)
) AS t(parents, enfants, sommes, transferts, email)
WHERE NOT EXISTS (SELECT 1 FROM cotisations LIMIT 1);


-- Compte administrateur par défaut (identifiant « admin » / mot de passe « cotiscola2026 »)
-- Créé UNE SEULE FOIS : jamais écrasé par les db:init suivants (WHERE NOT EXISTS).
INSERT INTO utilisateurs (identifiant, mot_de_passe, nom_complet, role)
SELECT 'admin',
       '$2b$10$ziy4mwG7Inx3iKQkxrgozegAQHyb6KZMQBQgk3I9dxqxJxm3wwTjK',
       'Administrateur',
       'admin'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE identifiant = 'admin');