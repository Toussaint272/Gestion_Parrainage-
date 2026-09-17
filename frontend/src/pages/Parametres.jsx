import { useState, useEffect } from 'react';
import { get, post, put, del, messageErreur, ar } from '../api/client.js';
import { useAnnee } from '../context/AnneeContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import { IcModifier, IcSupprimer, IcActiver } from '../components/Icones.jsx';

const ANNEE_VIDE = { libelle: '', date_debut: '', date_fin: '', total_cible: 0, statut: 'archivee' };
const TRANCHE_VIDE = { operateur: 'mvola', type_frais: 'envoi', tranche_min: '', tranche_max: '', frais: '' };

/** Paramètres : années scolaires (avec total cible fixe, RG2) + barème des frais (M10). */
export default function Parametres() {
  const toast = useToast();
  const { annees, recharger, setAnnee, annee } = useAnnee();
  const [editionAnnee, setEditionAnnee] = useState(null);
  const [bareme, setBareme] = useState([]);
  const [tranche, setTranche] = useState(TRANCHE_VIDE);

  const chargerBareme = () => get('/bareme?operateur=mvola').then((r) => setBareme(r.data)).catch((e) => toast(messageErreur(e), 'err'));
  useEffect(() => { chargerBareme(); }, []); // eslint-disable-line

  const enregistrerAnnee = async (e) => {
    e.preventDefault();
    try {
      const corps = { ...editionAnnee, total_cible: parseFloat(editionAnnee.total_cible) || 0 };
      const r = editionAnnee.id ? await put(`/annees-scolaires/${editionAnnee.id}`, corps) : await post('/annees-scolaires', corps);
      toast(r.message); setEditionAnnee(null); recharger();
    } catch (err) { toast(messageErreur(err), 'err'); }
  };

  const activerAnnee = async (a) => {
    const activeActuelle = annees.find((x) => x.statut === 'active');
    if (!confirm(`Activer l'année ${a.libelle} ?${activeActuelle ? ` L'année ${activeActuelle.libelle} (active) sera archivée — ses données sont conservées.` : ''}`)) return;
    try {
      const r = await put(`/annees-scolaires/${a.id}`, { statut: 'active' });
      toast(r.message);
      setAnnee(a);       // toute l'application bascule sur l'année réactivée
      recharger();
    }
    catch (err) { toast(messageErreur(err), 'err'); }
  };

  const supprimerAnnee = async (a) => {
    if (!confirm(`Supprimer l'année ${a.libelle} ?`)) return;
    try { const r = await del(`/annees-scolaires/${a.id}`); toast(r.message); recharger(); }
    catch (err) { toast(messageErreur(err), 'err'); }
  };

  const enregistrerTranche = async (e) => {
    e.preventDefault();
    try {
      const r = await post('/bareme', {
        ...tranche, tranche_min: parseFloat(tranche.tranche_min),
        tranche_max: parseFloat(tranche.tranche_max), frais: parseFloat(tranche.frais),
      });
      toast(r.message); setTranche(TRANCHE_VIDE); chargerBareme();
    } catch (err) { toast(messageErreur(err), 'err'); }
  };

  const supprimerTranche = async (t) => {
    if (!confirm(`Supprimer la tranche ${t.tranche_min} → ${t.tranche_max} (${t.type_frais}) ?`)) return;
    try { const r = await del(`/bareme/${t.id}`); toast(r.message); chargerBareme(); }
    catch (err) { toast(messageErreur(err), 'err'); }
  };

  const testerEmail = async () => {
    toast('Configurez SMTP dans backend/.env puis redémarrez le backend (voir Annexe A du dossier de conception).');
  };

  return (
    <>
      <div className="carte">
        <h2>🗓 Années scolaires <button className="btn btn-primaire btn-mini" onClick={() => setEditionAnnee({ ...ANNEE_VIDE })}>＋ Nouvelle année</button></h2>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead><tr><th>Année</th><th>Début</th><th>Fin</th><th className="nombre">Total cible (fixe)</th><th>Statut</th><th style={{ width: 230 }}>Actions</th></tr></thead>
            <tbody>
              {annees.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.libelle}</b></td>
                  <td>{new Date(a.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td>{new Date(a.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td className="nombre">{a.total_cible.toLocaleString('fr-FR')} Ar</td>
                  <td><span className={`badge badge-${a.statut}`}>{a.statut}</span></td>
                  <td><div className="cellule-actions">
                    {a.statut !== 'active' && <button className="btn btn-vert btn-mini btn-texte" title="Rendre active (l'année en cours sera archivée)" onClick={() => activerAnnee(a)}><IcActiver /> Activer</button>}
                    {annee?.id === a.id && <span className="badge badge-auto">sélectionnée</span>}
                    <button className="btn btn-neutre btn-mini" title="Modifier l'année" onClick={() => setEditionAnnee({ ...a, date_debut: a.date_debut?.slice(0, 10), date_fin: a.date_fin?.slice(0, 10) })}><IcModifier /></button>
                    <button className="btn btn-danger btn-mini" title="Supprimer l'année" onClick={() => supprimerAnnee(a)}><IcSupprimer /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="aide" style={{ marginTop: 8 }}>Le <b>total cible</b> est le montant fixe de l'année (RG2), ex. 7 173 808 Ar pour 26-27. Le « Reste » = cible − (sommes + transferts).</p>
      </div>

      <div className="carte">
        <h2>💰 Barème des frais — MVola <span className="badge badge-ville">envoi + retrait, arrondi au millier supérieur (RG9-RG10)</span></h2>
        <form onSubmit={enregistrerTranche} className="filtres" style={{ alignItems: 'flex-end' }}>
          <label className="filtre">Type
            <select value={tranche.type_frais} onChange={(e) => setTranche({ ...tranche, type_frais: e.target.value })}>
              <option value="envoi">Envoi</option><option value="retrait">Retrait</option>
            </select>
          </label>
          <label className="filtre">Tranche min (Ar)<input type="number" required min="1" value={tranche.tranche_min} onChange={(e) => setTranche({ ...tranche, tranche_min: e.target.value })} /></label>
          <label className="filtre">Tranche max (Ar)<input type="number" required min="1" value={tranche.tranche_max} onChange={(e) => setTranche({ ...tranche, tranche_max: e.target.value })} /></label>
          <label className="filtre">Frais (Ar)<input type="number" required min="0" value={tranche.frais} onChange={(e) => setTranche({ ...tranche, frais: e.target.value })} /></label>
          <button className="btn btn-primaire" type="submit">Enregistrer la tranche</button>
        </form>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table style={{ minWidth: 520 }}>
            <thead><tr><th>Type</th><th className="nombre">Tranche min</th><th className="nombre">Tranche max</th><th className="nombre">Frais</th><th></th></tr></thead>
            <tbody>
              {bareme.map((t) => (
                <tr key={t.id}>
                  <td><span className={`badge ${t.type_frais === 'envoi' ? 'badge-ville' : 'badge-archivee'}`}>{t.type_frais}</span></td>
                  <td className="nombre">{t.tranche_min.toLocaleString('fr-FR')}</td>
                  <td className="nombre">{t.tranche_max.toLocaleString('fr-FR')}</td>
                  <td className="nombre"><b>{t.frais.toLocaleString('fr-FR')} Ar</b></td>
                  <td><button className="btn btn-danger btn-mini" title="Supprimer la tranche" onClick={() => supprimerTranche(t)}><IcSupprimer /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="aide" style={{ marginTop: 8 }}>Une tranche existante (même opérateur / type / minimum) est <b>mise à jour</b> automatiquement. Le dépôt est gratuit.</p>
      </div>

      <div className="carte">
        <h2>✉ Configuration email (SMTP)</h2>
        <p className="aide">L'envoi des PDF par email se configure dans <code>backend/.env</code> : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM — puis redémarrez le backend. Reportez-vous à l'<b>Annexe A</b> du dossier de conception et au README.</p>
        <button className="btn btn-neutre" onClick={testerEmail}>Comment configurer ?</button>
      </div>

      {editionAnnee && (
        <Modal titre={editionAnnee.id ? `Modifier l'année ${editionAnnee.libelle}` : 'Nouvelle année scolaire'} onClose={() => setEditionAnnee(null)}>
          <form onSubmit={enregistrerAnnee} className="formulaire">
            <label>Libellé *<input required maxLength="7" placeholder="ex. 27-28" value={editionAnnee.libelle} onChange={(e) => setEditionAnnee({ ...editionAnnee, libelle: e.target.value })} /></label>
            <div className="champs-2">
              <label>Date de début *<input type="date" required value={editionAnnee.date_debut} onChange={(e) => setEditionAnnee({ ...editionAnnee, date_debut: e.target.value })} /></label>
              <label>Date de fin *<input type="date" required value={editionAnnee.date_fin} onChange={(e) => setEditionAnnee({ ...editionAnnee, date_fin: e.target.value })} /></label>
            </div>
            <label>Total cible fixe (Ar) — RG2<input type="number" min="0" value={editionAnnee.total_cible} onChange={(e) => setEditionAnnee({ ...editionAnnee, total_cible: e.target.value })} placeholder="ex. 7173808" /></label>
            <label>Statut
              <select value={editionAnnee.statut} onChange={(e) => setEditionAnnee({ ...editionAnnee, statut: e.target.value })}>
                <option value="archivee">Archivée</option><option value="active">Active</option>
              </select>
            </label>
            <p className="aide">Activer une année archive automatiquement les autres (RG8).</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-neutre" onClick={() => setEditionAnnee(null)}>Annuler</button>
              <button type="submit" className="btn btn-primaire">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}