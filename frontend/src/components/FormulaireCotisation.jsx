import { useState, useEffect } from 'react';
import { get, post, put, messageErreur, ar } from '../api/client.js';
import { useToast } from './Toast.jsx';
import Modal from './Modal.jsx';

/**
 * Formulaire « ＋ Ajouter » / « ✏ Modifier » :
 *  1) CHOIX DU MODE en haut : 📱 MVola (frais automatiques) ou 💵 Espèces (aucun frais) ;
 *  2) Noms des Parents · Noms des Enfants · Sommes ;
 *  - mode MVola  : dès la saisie de la Somme, les Transferts (envoi + retrait du barème,
 *    arrondis au millier supérieur) s'affichent automatiquement — jamais saisis ;
 *  - mode Espèces : Transferts = 0 (vide dans le tableau) ;
 *  - le N° est attribué automatiquement.
 */
export default function FormulaireCotisation({ ligne = null, anneeId, onClose, onSuccess }) {
  const toast = useToast();
  const [mode, setMode] = useState(ligne?.mode_paiement === 'especes' ? 'especes' : 'mvola');
  const [form, setForm] = useState({
    noms_parents: ligne?.noms_parents || '',
    noms_enfants: ligne?.noms_enfants || '',
    sommes: ligne ? String(ligne.sommes) : '',
    email: ligne?.email || '',
  });
  const [transferts, setTransferts] = useState(null);   // { total, detail } — uniquement en mode MVola
  const [occupe, setOccupe] = useState(false);
  const set = (champ, valeur) => setForm((f) => ({ ...f, [champ]: valeur }));

  const sommesNombre = parseFloat(form.sommes);

  // Calcul automatique des transferts (RG9-RG10) — uniquement en mode MVola
  useEffect(() => {
    setTransferts(null);
    if (mode !== 'mvola' || !sommesNombre || sommesNombre <= 0) return;
    const t = setTimeout(async () => {
      try {
        const r = await get(`/bareme/calcul?montant=${sommesNombre}&types=envoi,retrait`);
        setTransferts({ total: r.data.frais_total, detail: r.data.detail });
      } catch (e) { setTransferts({ erreur: messageErreur(e) }); }
    }, 400);
    return () => clearTimeout(t);
  }, [sommesNombre, mode]);

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.noms_parents.trim() || form.noms_parents.trim().length < 2) return toast('Saisissez le nom du parent', 'err');
    if (!sommesNombre || sommesNombre <= 0) return toast('Saisissez une somme positive', 'err');
    setOccupe(true);
    try {
      const corps = {
        noms_parents: form.noms_parents.trim(), noms_enfants: form.noms_enfants.trim(),
        sommes: sommesNombre, mode_paiement: mode, annee_id: anneeId,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      };
      const r = ligne?.id ? await put(`/cotisations/${ligne.id}`, corps) : await post('/cotisations', corps);
      toast(r.message);
      onSuccess?.();
      onClose();
    } catch (err) { toast(messageErreur(err), 'err'); }
    finally { setOccupe(false); }
  };

  return (
    <Modal titre={ligne?.id ? `N° ${ligne.id} — Modifier` : 'Ajouter une cotisation'} onClose={onClose}>
      <form onSubmit={soumettre} className="formulaire">

        {/* 1) Choix du mode de paiement */}
        <div className="choix-mode" role="radiogroup" aria-label="Mode de paiement">
          <button type="button" aria-pressed={mode === 'mvola'}
            className={`mode-btn ${mode === 'mvola' ? 'actif actif-mvola' : ''}`}
            onClick={() => setMode('mvola')}>
            📱 MVola <small>frais de transfert automatiques</small>
          </button>
          <button type="button" aria-pressed={mode === 'especes'}
            className={`mode-btn ${mode === 'especes' ? 'actif actif-especes' : ''}`}
            onClick={() => setMode('especes')}>
            💵 Espèces <small>aucun frais de transfert</small>
          </button>
        </div>

        {/* 2) Les colonnes de la feuille */}
        <label>Noms des Parents *
          <input required minLength="2" value={form.noms_parents} autoFocus
            onChange={(e) => set('noms_parents', e.target.value)} placeholder="ex. Mme Marie Louise" />
        </label>
        <label>Noms des Enfants
          <input value={form.noms_enfants} onChange={(e) => set('noms_enfants', e.target.value)}
            placeholder="ex. Bosco, Jean Luc, Emile (séparés par des virgules)" />
        </label>
        <label>Sommes (Ar) *
          <input type="number" min="1" step="1" required value={form.sommes}
            onChange={(e) => set('sommes', e.target.value)} placeholder="ex. 300000" />
        </label>

        {/* Transferts : automatiques en MVola, vides en Espèces */}
        {mode === 'especes' ? (
          <div className="sans-frais" role="status">
            💵 Paiement en <b>espèces</b> : aucun frais — la colonne Transferts restera <b>vide</b>.
          </div>
        ) : (
          form.sommes !== '' && (
            <div className="frais-calc" role="status">
              {transferts?.erreur ? (
                <span style={{ color: 'var(--rouge)' }}>⚠ {transferts.erreur}</span>
              ) : transferts ? (
                <>
                  <b>Transferts : {ar(transferts.total)}</b>
                  <span className="badge badge-auto">calcul automatique</span>
                  {transferts.detail.map((d) => (
                    <span key={d.type} className="frais-detail">{d.type} : {ar(d.frais)} <small>({d.tranche.replace(/\u202f/g, ' ')})</small></span>
                  ))}
                </>
              ) : (
                <span className="aide">Calcul automatique des transferts…</span>
              )}
            </div>
          )
        )}

        <p className="aide">
          {' '}
          {mode === 'mvola'
            ? 'En MVola, les Transferts (envoi + retrait, arrondis au millier supérieur) sont calculés automatiquement — rien à saisir.'
            : 'En espèces, aucun frais n\'est appliqué.'}
        </p>

        {!ligne?.id && (
          <p className="aide"></p>
        )}
        {ligne?.id && (
          <label>Email du parent (optionnel — pour l'envoi du reçu PDF)
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="parent@exemple.mg" />
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-neutre" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primaire" disabled={occupe}>{occupe ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}