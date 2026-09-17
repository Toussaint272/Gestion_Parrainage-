import { useState } from 'react';
import { post, messageErreur } from '../api/client.js';
import { useToast } from './Toast.jsx';
import Modal from './Modal.jsx';

/**
 * Création d'une nouvelle année scolaire (pour réutiliser l'application chaque année) :
 * - libellé suggéré à partir de l'année en cours (26-27 → 27-28) ;
 * - l'année précédente est archivée AUTOMATIQUEMENT (une seule année active — RG8) ;
 * - la nouvelle année devient active et est sélectionnée.
 */
export default function FormulaireAnnee({ anneePrecedente, onClose, onCreee }) {
  const toast = useToast();
  const prec = anneePrecedente;

  // « 26-27 » → « 27-28 » (garde le format saisi : 2026-2027 → 2027-2028)
  const suggerer = () => {
    const m = prec?.libelle?.match(/^(\d{2,4})-(\d{2,4})$/);
    if (!m) return { libelle: '', debut: '', fin: '' };
    const s1 = String(+m[1] + 1).padStart(m[1].length, '0');
    const s2 = String(+m[2] + 1).padStart(m[2].length, '0');
    return { libelle: `${s1}-${s2}`, debut: `20${s1.slice(-2)}-09-01`, fin: `20${s2.slice(-2)}-07-31` };
  };
  const sug = suggerer();

  const [form, setForm] = useState({
    libelle: sug.libelle,
    date_debut: sug.debut,
    date_fin: sug.fin,
    total_cible: prec?.total_cible ?? 0,
  });
  const set = (c, v) => setForm((f) => ({ ...f, [c]: v }));
  const [occupe, setOccupe] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    if (!/^\d{2,4}-\d{2,4}$/.test(form.libelle.trim())) return toast('Libellé attendu : ex. 27-28 ou 2027-2028', 'err');
    setOccupe(true);
    try {
      // statut: 'active' → le backend archive automatiquement l'année en cours (RG8)
      const r = await post('/annees-scolaires', { ...form, libelle: form.libelle.trim(), statut: 'active' });
      toast(`${r.message} — l'année ${prec?.libelle || 'précédente'} est archivée automatiquement`);
      onCreee?.(r.data);
      onClose();
    } catch (err) { toast(messageErreur(err), 'err'); }
    finally { setOccupe(false); }
  };

  return (
    <Modal titre="Nouvelle année scolaire" onClose={onClose}>
      <form onSubmit={soumettre} className="formulaire">
        <p className="aide" style={{ marginTop: 0 }}>
          L'année en cours ({prec?.libelle || '…'}) sera <b>archivée automatiquement</b> — ses données
          restent consultables à tout moment via la liste. La nouvelle année devient active.
        </p>
        <label>Libellé *
          <input required value={form.libelle} placeholder="ex. 27-28" autoFocus
            onChange={(e) => set('libelle', e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1 }}>Date de début *
            <input type="date" required value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>Date de fin *
            <input type="date" required value={form.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
          </label>
        </div>
        <label>Total cible (Ar)
          <input type="number" min="0" step="1" value={form.total_cible}
            onChange={(e) => set('total_cible', e.target.value)} placeholder="ex. 7173808" />
          <small className="aide">Repris de l'année {prec?.libelle || 'précédente'} — modifiable plus tard (crayon sur la ligne TOTAL).</small>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-neutre" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primaire" disabled={occupe}>{occupe ? 'Création…' : 'Créer l\'année'}</button>
        </div>
      </form>
    </Modal>
  );
}