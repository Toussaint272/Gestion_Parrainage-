import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAnnee } from '../context/AnneeContext.jsx';
import FormulaireAnnee from './FormulaireAnnee.jsx';
import { utilisateurCourant, deconnexion } from '../api/client.js';

const LIENS = [
  ['/', '📊', 'Tableau de bord'],
  ['/parents', '👨‍👩‍👧', 'Parents'],
  ['/rapports', '📄', 'Rapport & Mail'],
];

export default function Layout() {
  const { annees, annee, setAnnee, recharger } = useAnnee();
  const [ouvert, setOuvert] = useState(false);
  const [formAnnee, setFormAnnee] = useState(false);
  const nav = useNavigate();
  const utilisateur = utilisateurCourant();

  const seDeconnecter = async () => {
    if (!confirm('Se déconnecter de CotiScola ?')) return;
    await deconnexion();
    nav('/login', { replace: true });
  };

  return (
    <div className="app">
      <div className={`voile-mobile ${ouvert ? 'actif' : ''}`} onClick={() => setOuvert(false)} />
      <aside className={`sidebar ${ouvert ? 'ouverte' : ''}`}>
        <div className="logo"><span className="logo-icone">P</span><div><b>Parrainage</b><small>Compte</small></div></div>
        <nav>
          {LIENS.map(([to, icone, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOuvert(false)}
              className={({ isActive }) => (isActive ? 'lien actif' : 'lien')}>
              <span className="lien-icone">{icone}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-pied">
          <NavLink to="/parametres" onClick={() => setOuvert(false)}
            className={({ isActive }) => (isActive ? 'lien actif lien-parametres' : 'lien lien-parametres')}>
            <span className="lien-icone">⚙</span>Paramètres
          </NavLink>
          <div className="sidebar-annee">Année en cours<br /><b>{annee ? annee.libelle : '…'}</b></div>
          {utilisateur && (
            <button className="btn-deconnexion" onClick={seDeconnecter} title="Fermer la session">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
              Déconnexion <small>({utilisateur.identifiant})</small>
            </button>
          )}
        </div>
      </aside>

      <div className="principal">
        <header className="topbar">
          <button className="burger" onClick={() => setOuvert(!ouvert)} aria-label="Menu">☰</button>
          <div className="topbar-titre">Gestion de compte</div>
          <select className="select-annee" value={annee?.id || ''} onChange={(e) => setAnnee(annees.find((a) => a.id === +e.target.value))} aria-label="Année scolaire">
            {annees.map((a) => <option key={a.id} value={a.id}>Année {a.libelle}{a.statut === 'archivee' ? ' (archivée)' : ''}</option>)}
            {annees.length === 0 && <option>Aucune année</option>}
          </select>
          <button className="btn-annee" onClick={() => setFormAnnee(true)} title="Créer une nouvelle année scolaire (l'année en cours sera archivée)">＋ Année</button>
        </header>
        <main className="contenu"><Outlet /></main>
      </div>

      {formAnnee && (
        <FormulaireAnnee anneePrecedente={annee} onClose={() => setFormAnnee(false)}
          onCreee={(nouvelle) => { setAnnee(nouvelle); recharger(); }} />
      )}
    </div>
  );
}