import { useState, useEffect } from 'react';
import { get, messageErreur, ar } from '../api/client.js';
import { useAnnee } from '../context/AnneeContext.jsx';
import KpiCard from '../components/KpiCard.jsx';

/** Tableau de bord : 8 cartes — indicateurs financiers, statistiques et année scolaire. */
export default function Dashboard() {
  const { annee } = useAnnee();
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!annee) return;
    setStats(null);
    get(`/statistiques/${annee.id}`).then((r) => setStats(r.data)).catch((e) => setErreur(messageErreur(e)));
  }, [annee]);

  if (erreur) return <div className="carte"><div className="vide">⚠️ {erreur}</div></div>;
  if (!stats) return <div className="chargement">Chargement du tableau de bord…</div>;
  const restePositif = stats.reste > 0;

  return (
    <>
      {/* Ligne 1 — les 4 indicateurs financiers */}
      <div className="grille-kpi">
        <KpiCard label="Total cible (fixe)" valeur={ar(stats.cible)} sousTexte={`Année ${stats.annee}`} couleur="bleu" />
        <KpiCard label="Encaissé (sommes)" valeur={ar(stats.sommes)} sousTexte={`${stats.nb_paiements} paiement(s)`} couleur="vert" />
        <KpiCard label="Frais de transferts" valeur={ar(stats.transferts)} sousTexte="envoi + retrait, arrondis" couleur="violet" />
        <KpiCard label={restePositif ? 'Reste à collecter' : 'Objectif atteint 🎉'}
          valeur={ar(Math.abs(stats.reste))}
          sousTexte="cible − (sommes + transferts)" couleur={restePositif ? 'ambre' : 'vert'} />
      </div>

      {/* Ligne 2 — statistiques et année scolaire, même style de cartes */}
      <div className="grille-kpi">
        <KpiCard label="Parents enregistrés" valeur={stats.compteurs.parents} sousTexte="dans la liste" couleur="bleu" />
        <KpiCard label="Enfants suivis" valeur={stats.compteurs.enfants} sousTexte="toutes lignes" couleur="violet" />
        <KpiCard label="Paiements enregistrés" valeur={stats.nb_paiements} sousTexte="lignes de cotisation" couleur="vert" />
        <div className="kpi kpi-annee">
          <div className="kpi-label">Année</div>
          <div className="kpi-valeur">{stats.annee}</div>
          <div className="kpi-sous">année active</div>
        </div>
      </div>
    </>
  );
}