import { fmt } from '../utils/arrondi.js';
import { enLettresAr } from '../utils/montantEnLettres.js';

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;font-size:12px}
  .recu{max-width:680px;margin:0 auto;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden}
  .entete{background:#1e3a8a;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center}
  .entete h1{font-size:17px} .entete .etab{font-size:10.5px;color:#c7d2fe;margin-top:3px}
  .titre{background:#eff6ff;padding:8px 22px;font-weight:700;font-size:13px;color:#1e3a8a;letter-spacing:.4px}
  table{width:100%;border-collapse:collapse}
  td,th{border-bottom:1px solid #e2e8f0;padding:7px 22px;text-align:left;vertical-align:top}
  th{background:#f8fafc;width:200px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.3px}
  .montant-box{margin:14px 22px;border:2px solid #059669;border-radius:8px;padding:12px 16px;background:#ecfdf5}
  .montant-box .big{font-size:20px;font-weight:800;color:#065f46}
  .montant-box .lettres{font-size:11px;color:#047857;font-style:italic;margin-top:3px}
  .frais{margin:0 22px;font-size:11px;color:#475569}
  .signatures{display:flex;justify-content:space-between;padding:26px 22px 8px}
  .signatures div{width:220px;text-align:center;font-size:11px;color:#475569}
  .signatures .ligne{border-top:1px solid #94a3b8;margin-top:44px;padding-top:5px}
  .pied{background:#f1f5f9;padding:8px 22px;font-size:9.5px;color:#64748b;display:flex;justify-content:space-between}
  .num{font-weight:800;color:#1e3a8a}
`;

/** Gabarit HTML du reçu de cotisation (rendu PDF via Puppeteer, format A5 paysage). */
export function recuHtml(d) {
  const frais = d.transferts > 0
    ? `<p class="frais">Frais de transfert (envoi + retrait, barème MVola, arrondis) : <b>${fmt(d.transferts)} Ar</b></p>`
    : '<p class="frais">Frais de transfert : —</p>';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="recu">
    <div class="entete">
      <div><h1>${d.etab.nom}</h1><div class="etab">${d.etab.adresse} — ${d.etab.contact}</div></div>
      <div style="text-align:right"><div style="font-size:10px;color:#c7d2fe">Année scolaire</div><div style="font-size:16px;font-weight:700">${d.annee}</div></div>
    </div>
    <div class="titre">REÇU DE COTISATION <span class="num">N° ${d.numero}</span></div>
    <table>
      <tr><th>Date</th><td>${d.date_paiement}</td></tr>
      <tr><th>Noms des Parents</th><td><b>${d.noms_parents}</b></td></tr>
      <tr><th>Noms des Enfants</th><td>${d.noms_enfants}</td></tr>
    </table>
    <div class="montant-box">
      <div class="big">${fmt(d.sommes)} Ar</div>
      <div class="lettres">${enLettresAr(d.sommes)}</div>
    </div>
    ${frais}
    <div class="signatures">
      <div><div class="ligne">Le parent</div></div>
      <div><div class="ligne">Le trésorier</div></div>
    </div>
    <div class="pied"><span>Reçu généré le ${d.genere_le} par CotiScola</span><span>Conservez ce reçu, il vous sera demandé</span></div>
  </div></body></html>`;
}
