import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, messageErreur } from '../api/client.js';

/** Page de connexion — seule page accessible sans session. */
export default function LoginPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ identifiant: '', mot_de_passe: '' });
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!form.identifiant.trim() || !form.mot_de_passe) return setErreur('Saisissez votre identifiant et votre mot de passe.');
    setOccupe(true);
    try {
      const r = await post('/auth/login', { identifiant: form.identifiant.trim(), mot_de_passe: form.mot_de_passe });
      localStorage.setItem('cotiscola_user', JSON.stringify(r.data || { identifiant: form.identifiant }));
      nav('/', { replace: true });
    } catch (err) {
      setErreur(messageErreur(err, 'Connexion impossible — vérifiez que le serveur est démarré'));
    } finally { setOccupe(false); }
  };

  return (
    <div className="login-page">
      <span className="login-bulle b1" aria-hidden="true" />
      <span className="login-bulle b2" aria-hidden="true" />
      <span className="login-bulle b3" aria-hidden="true" />

      <div className="login-cadre">
        {/* Panneau de marque (masqué sur mobile) */}
        <div className="login-marque">
          <div className="login-logo">P</div>
          <h1>Parrainage</h1>
          <p className="login-slogan">Gestion de compte</p>
          <ul className="login-atouts">
            <li><span className="puce">📱</span> Transferts MVola calculés automatiquement</li>
            <li><span className="puce">💵</span> Mode espèces sans frais</li>
            <li><span className="puce">📄</span> Rapport PDF &amp; envoi par email</li>
            <li><span className="puce">🗓</span> Archivage d'une année sur l'autre</li>
          </ul>
        </div>

        {/* Carte de connexion */}
        <div className="login-carte">
          <div className="login-carte-entete">
            <span className="login-logo-mini">C</span>
            <h2>Bon retour !</h2>
            <p>Connectez-vous pour accéder à la gestion des cotisations</p>
          </div>

          {erreur && <div className="login-erreur" role="alert">⚠️ {erreur}</div>}

          <form onSubmit={soumettre} className="login-form">
            <label>
              <span className="login-icone-champ">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <input type="text" autoFocus autoComplete="username" placeholder="Identifiant"
                value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} />
            </label>
            <label>
              <span className="login-icone-champ">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <input type={voir ? 'text' : 'password'} autoComplete="current-password" placeholder="Mot de passe"
                value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} />
              <button type="button" className="login-oeil" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer' : 'Afficher'}>
                {voir ? (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </label>
            <button type="submit" className="login-bouton" disabled={occupe}>
              {occupe ? 'Connexion…' : 'Se connecter'}
              {!occupe && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              )}
            </button>
          </form>

          <p className="login-pied">Session sécurisée — rester connecté 30 jours</p>
        </div>
      </div>
    </div>
  );
}