import { useState, useEffect } from 'react';
import { get, post, urlPdf, messageErreur, dateFr } from '../api/client.js';
import { useAnnee } from '../context/AnneeContext.jsx';
import { useToast } from '../components/Toast.jsx';

/** Génération du rapport annuel PDF, envoi par email et journal des envois. */
export default function Rapports() {
  const { annee } = useAnnee();
  const toast = useToast();
  const [destinataire, setDestinataire] = useState('');
  const [emails, setEmails] = useState([]);      // emails enregistrés (parents + anciens envois)
  const [occupe, setOccupe] = useState(false);
  const [journal, setJournal] = useState(null);

  const ajouterEmails = (liste) => setEmails((anciens) => {
    const s = new Set(anciens);
    liste.forEach((m) => { if (m) s.add(String(m).toLowerCase().trim()); });
    return [...s].sort();
  });

  const chargerJournal = () => {
    get('/emails/logs').then((r) => {
      const j = Array.isArray(r) ? r : (Array.isArray(r.data) ? r.data : []);
      setJournal(j);
      ajouterEmails(j.map((l) => l.destinataire));
    }).catch((e) => toast(messageErreur(e), 'err'));
  };
  useEffect(chargerJournal, []); // eslint-disable-line
  useEffect(() => { chargerJournal(); }, [annee]); // eslint-disable-line

  // Emails déjà enregistrés sur les lignes de cotisation de l'année (colonne Email)
  useEffect(() => {
    if (!annee) return;
    get(`/cotisations/${annee.id}`).then((r) => {
      const d = r.data || r;
      ajouterEmails((d.lignes || []).map((l) => l.email));
    }).catch(() => { /* silencieux : la liste restera simplement vide */ });
  }, [annee]); // eslint-disable-line

  const envoyerRapport = async (e) => {
    e.preventDefault();
    if (!annee) return toast('Aucune année sélectionnée', 'err');
    setOccupe(true);
    try {
      const r = await post('/emails/rapport', { annee_id: annee.id, destinataire });
      toast(r.message); chargerJournal();
    } catch (err) { toast(messageErreur(err), 'err'); }
    finally { setOccupe(false); }
  };

  const renvoyer = async (l) => {
    try { const r = await post(`/emails/logs/${l.id}/renvoyer`); toast(r.message); chargerJournal(); }
    catch (e) { toast(messageErreur(e), 'err'); }
  };

  if (!annee) return <div className="carte"><div className="vide">Aucune année sélectionnée.</div></div>;

  return (
    <>
      <div className="grille-kpi" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="carte" style={{ margin: 0 }}>
          <h2>📄 Rapport annuel PDF</h2>
          <p className="aide" style={{ marginBottom: 12 }}>
            Tableau complet de l'année <b>{annee.libelle}</b> (parents, enfants, sommes, transferts, totaux, reste) au format PDF.
          </p>
          <a className="btn btn-primaire" href={urlPdf(`/pdf/rapport?annee_id=${annee.id}`)} target="_blank" rel="noreferrer">
            ⬇ Télécharger le rapport {annee.libelle}
          </a>
        </div>
        <div className="carte" style={{ margin: 0 }}>
          <h2>✉ Envoyer le rapport par email</h2>
          <form onSubmit={envoyerRapport} className="formulaire">
            <label>Email du destinataire (direction, trésorier…)
              <input type="email" required list="emails-enregistres" value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                placeholder="choisir dans la liste ou écrire ici" autoComplete="off" />
            </label>
            {/* Liste déroulante des emails déjà enregistrés — la saisie libre reste possible */}
            <datalist id="emails-enregistres">
              {emails.map((m) => <option key={m} value={m} />)}
            </datalist>
          
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button className="btn btn-vert" disabled={occupe} style={{ width: 'auto', padding: '8px 18px' }}>
                {occupe ? 'Envoi en cours…' : 'Générer le PDF et envoyer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="carte">
        <h2>📬 Journal des emails envoyés</h2>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Destinataire</th><th>Parent</th><th>Sujet</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {(journal || []).map((l) => (
                <tr key={l.id}>
                  <td>{dateFr(l.envoye_le)}</td>
                  <td><span className={`badge ${l.type_document === 'recu' ? 'badge-ville' : 'badge-archivee'}`}>{l.type_document}</span></td>
                  <td>{l.destinataire}</td>
                  <td>{l.noms_parents || '—'}</td>
                  <td style={{ maxWidth: 240 }}>{l.sujet}</td>
                  <td>
                    <span className={`badge ${l.statut === 'envoye' ? 'badge-envoye' : 'badge-echec'}`}>{l.statut}</span>
                    {l.erreur && <span className="sous-texte" title={l.erreur}>{l.erreur.slice(0, 40)}…</span>}
                  </td>
                  <td>{l.statut === 'echec' && <button className="btn btn-neutre btn-mini" onClick={() => renvoyer(l)}>Renvoyer</button>}</td>
                </tr>
              ))}
              {journal && journal.length === 0 && <tr><td colSpan="7" className="vide">Aucun email envoyé pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}