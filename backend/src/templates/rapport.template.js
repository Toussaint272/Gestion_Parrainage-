import { fmt } from '../utils/arrondi.js';

/*
 * Gabarit du rapport PDF — copie conforme du tableau de l'application :
 * colonnes N° · Noms des Parents · Noms des Enfants · Sommes · Transferts (badge « auto »),
 * ligne TOTAL (avec le Total cible dans la colonne Enfants) et ligne RESTE. Format A4 portrait.
 */
const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;font-size:11px}
  .entete{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1e3a8a;padding-bottom:8px;margin-bottom:12px}
  .entete h1{font-size:16px;color:#1e3a8a}
  .entete .etab{font-size:9.5px;color:#64748b}
  .entete .annee{font-size:13px;font-weight:800;color:#1e3a8a;text-align:right}
  table{width:100%;border-collapse:collapse}
  th{background:#e2e8f0;color:#0f172a;padding:7px 8px;font-size:10px;text-transform:uppercase;text-align:left;border:1px solid #cbd5e1;letter-spacing:.3px}
  td{border:1px solid #cbd5e1;padding:6px 8px;vertical-align:top}
  tbody tr:nth-child(even) td{background:#f8fafc}
  .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .centre{text-align:center}
  .badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:8.5px;font-weight:700;background:#d1fae5;color:#065f46;vertical-align:middle;margin-left:4px}
  tfoot td{font-weight:800;border-top:2px solid #1e3a8a}
  .ligne-total td{background:#eef2ff;color:#1e3a8a;font-size:11.5px}
  .ligne-reste td{background:#fffbeb;color:#b45309;border-top:1px solid #fde68a}
  .pied{margin-top:14px;font-size:8.5px;color:#94a3b8;display:flex;justify-content:space-between}
`;

export function rapportHtml(d) {
  const lignes = d.lignes.map((l, i) => `
    <tr>
      <td class="centre">${i + 1}</td>
      <td><b>${l.noms_parents}</b></td>
      <td>${l.noms_enfants || '—'}</td>
      <td class="num">${fmt(l.sommes)}</td>
      <td class="num">${l.transferts ? `${fmt(l.transferts)}${l.transfert_auto ? '' : ''}` : '—'}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>${css}</style></head><body>
    <div class="entete">
      <div><h1>${d.etab.nom}</h1><div class="etab">${d.etab.adresse} — ${d.etab.contact}</div></div>
      <div class="annee">Liste de compte<br>Année ${d.annee}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="centre" style="width:34px">N°</th>
          <th>Noms des Parents</th>
          <th>Noms des Enfants</th>
          <th class="num" style="width:100px">Sommes (Ar)</th>
          <th class="num" style="width:110px">Transferts (Ar)</th>
        </tr>
      </thead>
      <tbody>${lignes}</tbody>
      <tfoot>
        <tr class="ligne-total">
          <td colspan="2">TOTAL (${d.lignes.length} lignes)</td>
          <td class="num">${fmt(d.totaux.cible)}</td>
          <td class="num">${fmt(d.totaux.sommes)}</td>
          <td class="num">${fmt(d.totaux.transferts)}</td>
        </tr>
        <tr class="ligne-reste">
          <td colspan="4">RESTE</td>
          <td class="num">${fmt(d.totaux.reste)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="pied"><span>Généré le ${d.genere_le} par CotiScola</span><span>Document interne — compte</span></div>
  </body></html>`;
}