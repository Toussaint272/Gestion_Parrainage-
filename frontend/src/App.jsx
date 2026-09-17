import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Parents from './pages/Parents.jsx';
import Rapports from './pages/Rapports.jsx';
import Parametres from './pages/Parametres.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { AnneeProvider } from './context/AnneeContext.jsx';
import { utilisateurCourant } from './api/client.js';

/** Garde : sans session, toutes les pages renvoient vers la connexion.
 *  AnneeProvider est monté ICI (zone protégée) : les données ne se chargent
 *  qu'après le login, et rien n'appelle l'API sur la page de connexion. */
function Protege({ children }) {
  if (!utilisateurCourant()) return <Navigate to="/login" replace />;
  return <AnneeProvider>{children}</AnneeProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protege><Layout /></Protege>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parents" element={<Parents />} />
        <Route path="/rapports" element={<Rapports />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}