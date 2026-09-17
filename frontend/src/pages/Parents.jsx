import { useState, useEffect } from 'react';
import { get, put, del, messageErreur } from '../api/client.js';
import { useAnnee } from '../context/AnneeContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import FormulaireCotisation from '../components/FormulaireCotisation.jsx';
import { IcModifier, IcSupprimer } from '../components/Icones.jsx';

/**
 * Page principale — UNE SEULE TABLE, miroir de la feuille Excel :
 * N° (auto) · Noms des Parents · Noms des Enfants · Sommes · Transferts (auto) · Actions
 * + ligne TOTAL (avec le Total cible, modifiable) et ligne RESTE en bas.
 */
export default function Parents() {
  const { annee } = useAnnee();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [formulaire, setFormulaire] = useState(null);      // 'ajout' | objet ligne (modification)
  const [editionCible, setEditionCible] = useState(false); // modale « Modifier le total cible »
  const [nouvelleCible, setNouvelleCible] = useState('');

  const charger = (motif = recherche) => {
    if (!annee) return;
    get(`/cotisations/${annee.id}?search=${encodeURIComponent(motif)}`)
      .then((r) => setData(r.data))
      .catch((e) => toast(messageErreur(e), 'err'));
  };
  useEffect(() => { setData(null); charger(); }, [annee]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => charger(recherche), 350);
    return () => clearTimeout(t);
  }, [recherche]); // eslint-disable-line

  const supprimer = async (l) => {
    if (!confirm(`Supprimer la ligne N° ${l.id} — ${l.noms_parents} ?`)) return;
    try { const r = await del(`/cotisations/${l.id}`); toast(r.message); charger(); }
    catch (err) { toast(messageErreur(err), 'err'); }
  };

  /** Enregistre le nouveau Total cible de l'année — le RESTE se recalcule tout seul. */
  const enregistrerCible = async (e) => {
    e.preventDefault();
    const valeur = parseFloat(nouvelleCible);
    if (isNaN(valeur) || valeur < 0) return toast('Saisissez un montant valide', 'err');
    try {
      const r = await put(`/annees-scolaires/${annee.id}`, { total_cible: valeur });
      toast(`Total cible mis à jour : ${valeur.toLocaleString('fr-FR')} Ar`);
      setEditionCible(false);
      charger();
    } catch (err) { toast(messageErreur(err), 'err'); }
  };

  if (!annee) return <div className="carte"><div className="vide">Aucune année scolaire — créez-en une dans ⚙ Paramètres.</div></div>;

  return (
    <>
      {/* Barre d'outils : recherche à gauche, ＋ Ajouter en haut à droite */}
      <div className="carte" style={{ padding: 14 }}>
        <div className="barre-outils" style={{ marginBottom: 0 }}>
          <input type="search" placeholder="🔍 Rechercher un parent ou un enfant…"
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          <button className="btn btn-primaire" onClick={() => setFormulaire('ajout')}>＋ Ajouter</button>
        </div>
      </div>

      {!data ? <div className="chargement">Chargement du tableau…</div> : (
        <div className="table-wrap">
          <table className="table-classeur">
            <thead>
              <tr>
                <th className="col-num">N°</th>
                <th>Noms des Parents</th>
                <th>Noms des Enfants</th>
                <th className="nombre">Sommes (Ar)</th>
                <th className="nombre">Transferts (Ar)</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.lignes.map((l, i) => (
                <tr key={l.id}>
                  <td className="col-num">{i + 1}</td>
                  <td><b>{l.noms_parents}</b></td>
                  <td style={{ maxWidth: 300 }}>{l.noms_enfants || '—'}</td>
                  <td className="nombre">{l.sommes.toLocaleString('fr-FR')}</td>
                  <td className="nombre">
                    {l.transferts ? l.transferts.toLocaleString('fr-FR') : '—'}
                    {l.transferts > 0 && <span className={`badge ${l.transfert_auto ? '' : 'badge-manuel'}`} style={{ marginLeft: 6 }}>{l.transfert_auto ? '' : 'importé'}</span>}
                  </td>
                  <td>
                    <div className="cellule-actions">
                      <button className="btn btn-neutre btn-mini" title="Modifier"
                        onClick={() => setFormulaire(l)}><IcModifier /></button>
                      <button className="btn btn-danger btn-mini" title="Supprimer"
                        onClick={() => supprimer(l)}><IcSupprimer /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.lignes.length === 0 && <tr><td colSpan="6" className="vide">Aucune ligne — cliquez sur « ＋ Ajouter ».</td></tr>}
            </tbody>
            {data.lignes.length > 0 && (
              <tfoot>
                <tr className="ligne-total">
                  <td colSpan="2">TOTAL ({data.lignes.length} lignes)</td>
                  <td className="nombre">
                    <span className="cible-bloc" title="Total cible (fixe) — cliquez sur le crayon pour le modifier">
                      {data.totaux.cible.toLocaleString('fr-FR')}
                      <button className="btn-cible" onClick={() => { setNouvelleCible(String(data.totaux.cible)); setEditionCible(true); }}
                        title="Modifier le total cible"><IcModifier taille={12} /></button>
                    </span>
                  </td>
                  <td className="nombre">{data.totaux.sommes.toLocaleString('fr-FR')}</td>
                  <td className="nombre">{data.totaux.transferts.toLocaleString('fr-FR')}</td>
                  <td />
                </tr>
                <tr className="ligne-reste">
                  <td colSpan="4">RESTE</td>
                  <td className="nombre">{data.totaux.reste.toLocaleString('fr-FR')}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Modale ＋ Ajouter / ✏ Modifier — 3 champs, transferts automatiques */}
      {formulaire && (
        <FormulaireCotisation
          ligne={formulaire === 'ajout' ? null : formulaire}
          anneeId={annee.id}
          onClose={() => setFormulaire(null)}
          onSuccess={charger}
        />
      )}

      {/* Modale : modifier le Total cible (fixe) de l'année */}
      {editionCible && (
        <Modal titre={`Total cible (fixe) — année ${annee.libelle}`} onClose={() => setEditionCible(false)}>
          <form onSubmit={enregistrerCible} className="formulaire">
            <label>Total cible (Ar) *
              <input type="number" min="0" step="1" required autoFocus value={nouvelleCible}
                onChange={(e) => setNouvelleCible(e.target.value)} placeholder="ex. 7173808" />
            </label>
            <p className="aide">Le RESTE = Total cible − (Sommes + Transferts) sera recalculé automatiquement.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-neutre" onClick={() => setEditionCible(false)}>Annuler</button>
              <button type="submit" className="btn btn-primaire">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}