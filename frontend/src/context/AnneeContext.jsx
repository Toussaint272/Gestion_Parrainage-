import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, messageErreur } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';

const Ctx = createContext(null);
export const useAnnee = () => useContext(Ctx);

/** Année scolaire sélectionnée (équivalent des onglets du classeur) — partagée par toute l'application. */
export function AnneeProvider({ children }) {
  const toast = useToast();
  const [annees, setAnnees] = useState([]);
  const [annee, setAnneeState] = useState(null);

  const charger = useCallback(async () => {
    try {
      const r = await get('/annees-scolaires');
      setAnnees(r.data);
      const active = r.data.find((a) => a.statut === 'active') || r.data[0] || null;
      setAnneeState((prev) => {
        const conservee = prev && r.data.find((a) => a.id === prev.id);
        return conservee || active;
      });
    } catch (e) {
      toast(messageErreur(e, 'Impossible de charger les années scolaires'), 'err');
    }
  }, [toast]);

  useEffect(() => { charger(); }, [charger]);

  const setAnnee = (a) => a && setAnneeState(a);
  const recharger = () => charger();

  return <Ctx.Provider value={{ annees, annee, setAnnee, recharger }}>{children}</Ctx.Provider>;
}
