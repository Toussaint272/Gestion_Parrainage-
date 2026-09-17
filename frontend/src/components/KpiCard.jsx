export default function KpiCard({ label, valeur, sousTexte, couleur = 'bleu' }) {
  return (
    <div className={`kpi kpi-${couleur}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-valeur">{valeur}</div>
      {sousTexte && <div className="kpi-sous">{sousTexte}</div>}
    </div>
  );
}
