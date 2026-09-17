import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

/** Notifications éphémères (succès / erreur). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
            <span>{t.type === 'err' ? '⚠️' : '✅'}</span> {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
