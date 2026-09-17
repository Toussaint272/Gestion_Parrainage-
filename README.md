# 📘 CotiScola — Gestion des cotisations des parents d'élèves

Application web complète : **React 18 (Vite)** + **Node.js / Express** + **PostgreSQL**.
CRUD complet, tableau de suivi type classeur, **reçus & rapports PDF** (Puppeteer) et **envoi par email** (Nodemailer),
frais de transfert MVola **calculés automatiquement** (envoi + retrait) et **arrondis au millier supérieur**.

> 📐 Le dossier de conception complet se trouve dans `docs/conception.html` (à ouvrir dans un navigateur).

---

## 🖥️ 1. Installer les prérequis (Windows 11)

| Logiciel | Lien | Remarque |
|---|---|---|
| **Node.js 20 LTS** | https://nodejs.org → « LTS » | Installer avec les options par défaut |
| **PostgreSQL 17** | https://www.postgresql.org/download/windows/ | Pendant l'installation, notez bien le **mot de passe** du compte `postgres` (ex. `postgres`) — port `5432` |
| **VS Code** | https://code.visualstudio.com | Recommandé : extension « ESLint » (facultatif) |

Vérifiez dans un **terminal PowerShell** :
```powershell
node --version    # v20.x attendu
psql --version    # psql 17.x attendu
```

---

## 📦 2. Installer le projet (dans E:\projetmasera)

1. **Décompressez** `cotiscola-projet.zip` dans `E:\projetmasera`
   (le contenu doit donner : `E:\projetmasera\backend`, `E:\projetmasera\frontend`, `README.md`…)
2. Ouvrez le dossier dans **VS Code** : `Fichier → Ouvrir le dossier… → E:\projetmasera`
3. Ouvrez un terminal intégré : menu `Terminal → Nouveau terminal` (ou `Ctrl + ù`)
4. Installez toutes les dépendances (backend + frontend) :
   ```powershell
   npm run install:all
   ```
   ⏳ Comptez 3 à 10 minutes (Puppeteer télécharge Chrome, ~300 Mo, une seule fois).

---

## 🗄️ 3. Créer la base de données

Le fichier `backend/.env` est **déjà configuré** :
```
DATABASE_URL=postgresql://cotisa:cotisa@localhost:5432/cotisations_db
ADMIN_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```
➡️ Si votre mot de passe PostgreSQL (`postgres`) est différent, **modifiez la ligne `ADMIN_DATABASE_URL`**.

Créez les tables + le barème MVola + les données de démonstration (classeur 26-27) :
```powershell
npm run db:init
```
Résultat attendu : `✅ Base de données prête : cotisations_db`

---

## ▶️ 4. Lancer l'application

Ouvrez **deux terminaux** dans VS Code :

```powershell
# Terminal 1 — l'API (port 5000)
npm run dev:backend
```
```powershell
# Terminal 2 — l'interface (port 5173)
npm run dev:frontend
```

Ouvrez **http://localhost:5173** dans votre navigateur. 🎉

L'année active « 26-27 » est pré-remplie avec la démo du classeur :
cible **7 173 808** · encaissé **6 930 000** · transferts **171 000** · **reste 72 808 Ar**.

---

## 📱 5. Utiliser sur mobile (même réseau Wi-Fi)

1. Trouvez l'adresse IP de votre PC : `ipconfig` → ligne **IPv4** (ex. `192.168.1.20`)
2. Autorisez Node.js dans le pare-feu Windows la première fois (clic droit sur le terminal → « Autoriser »), ou :
   `Pare-feu Windows → Autoriser une application → cocher Node.js (privé)`
3. Sur le téléphone (même Wi-Fi) : ouvrez `http://192.168.1.20:5173` ✅
   L'interface est **entièrement responsive** (menu burger, tableau scrollable).

---

## ✉️ 6. Activer l'envoi des PDF par email (Gmail)

1. Sur votre compte Google : activer la **validation en deux étapes**
2. Puis https://myaccount.google.com/apppasswords → créer un **mot de passe d'application (16 caractères)**
3. Dans `backend/.env` :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=votre.adresse@gmail.com
   SMTP_PASS=les16caracteresgeneres
   MAIL_FROM="CotiScola <votre.adresse@gmail.com>"
   ```
4. Redémarrez le backend (`Ctrl + C` puis `npm run dev:backend`).
5. Complétez l'**email des parents** (page Parents → clic sur le nom), ouvrez sa fiche puis bouton ✉ sur le paiement.
   Variante professionnelle : Brevo / Mailgun (300 emails/jour gratuits) — mêmes champs SMTP.

---

## 📄 7. PDF & import du classeur réel

- **PDF** : rien à installer — Puppeteer gère tout (reçu A5 + rapport A4 paysage).
- **Importer votre vrai classeur** (exporté depuis Google Sheets au format `.xlsx`) :
  ```powershell
  # facultatif : vider d'abord les données de démo
  psql -U cotisa -d cotisations_db -c "TRUNCATE emails_logs, paiements, enfants, parents RESTART IDENTITY CASCADE;"

  npm run db:import -- "C:\chemin\vers\classeur.xlsx" "26-27"
  ```
  Le script crée parents/enfants/paiements pour chaque onglet et affiche les totaux à comparer au classeur.
  ⚠️ Les emails des parents ne figurent pas dans le classeur : complétez-les ensuite dans la page Parents.

---

## 🚀 8. Production (résumé)

```powershell
npm run build          # construit frontend/dist
npm start              # Express sert l'interface + l'API sur le port 5000
```
Ouvrez http://localhost:5000. Pour une vraie mise en production : Nginx/IIS en reverse proxy HTTPS + service Windows (PM2 : `npm i -g pm2` puis `pm2 start backend/src/server.js --name cotiscola`).

---

## 🧭 Structure du projet

```
cotiscola/
├─ backend/
│  ├─ sql/               # 01_schema.sql · 02_views.sql · 03_seed.sql (barème MVola + démo)
│  ├─ scripts/           # init-db.js · import-excel.js
│  └─ src/               # config · controllers · routes · services (frais, pdf, email) · templates · validators
├─ frontend/
│  └─ src/               # api · components · context · pages · styles.css
├─ docs/conception.html  # dossier de conception v1.1 (règles RG1→RG11)
└─ README.md
```

## 🧮 Rappels des règles métier implémentées

- **RG2** : Total de l'année = **cible fixe** saisie par année (ex. 7 173 808 Ar) — page Paramètres
- **RG4** : **Reste = Cible − (Sommes + Transferts)**
- **RG9** : Transfert = **frais d'envoi + frais de retrait** selon le barème opérateur (table `bareme_frais`, modifiable dans Paramètres)
- **RG10** : somme des frais **arrondie au millier supérieur** (6 572 → 7 000) — pas réglable via `ARRONDI_PAS`
- **RG11** : calcul **automatique dès la saisie** du montant, saisie manuelle possible (tracée par `frais_auto = false`)
