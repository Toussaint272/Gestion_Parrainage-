const wrap = (titre, corps) => `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:#1e3a8a;border-radius:12px 12px 0 0;padding:18px 24px;color:#fff">
      <div style="font-size:18px;font-weight:800">CotiScola</div>
      <div style="font-size:12px;color:#c7d2fe">Cotisations des parents d'élèves</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="font-size:16px;color:#0f172a;margin:0 0 10px">${titre}</h2>
      ${corps}
      <p style="font-size:11px;color:#94a3b8;margin-top:22px;border-top:1px solid #e2e8f0;padding-top:12px">
        Cet email a été envoyé automatiquement par l'application CotiScola. Merci de ne pas y répondre directement.</p>
    </div>
  </div></body></html>`;

export const emailRecu = (d) => wrap('Votre reçu de cotisation', `
  <p style="font-size:13px;color:#334155">Bonjour <b>${d.noms_parents}</b>,</p>
  <p style="font-size:13px;color:#334155;line-height:1.6">Nous confirmons la réception de la cotisation
  <b style="color:#047857">${Number(d.sommes).toLocaleString('fr-FR')} Ar</b>
  pour l'année scolaire <b>${d.annee}</b> (reçu n° <b>${d.numero}</b>).${d.transferts > 0 ? ` Frais de transfert : ${Number(d.transferts).toLocaleString('fr-FR')} Ar.` : ''}</p>
  <p style="font-size:13px;color:#334155">Vous trouverez le reçu officiel en <b>pièce jointe PDF</b>.</p>
  <p style="font-size:13px;color:#334155;margin-bottom:0">Avec nos remerciements,<br><b>${d.etab.nom}</b></p>`);

export const emailRapport = (d) => wrap('Rapport des cotisations', `
  <p style="font-size:13px;color:#334155">Bonjour,</p>
  <p style="font-size:13px;color:#334155;line-height:1.6">Veuillez trouver en pièce jointe la <b>liste des cotisations</b>
  de l'année scolaire <b>${d.annee}</b> :</p>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:10px 0">
    <tr><td style="padding:6px;border:1px solid #e2e8f0">Encaissé</td><td style="padding:6px;border:1px solid #e2e8f0;text-align:right"><b>${Number(d.totaux.sommes).toLocaleString('fr-FR')} Ar</b></td></tr>
    <tr><td style="padding:6px;border:1px solid #e2e8f0">Frais de transferts</td><td style="padding:6px;border:1px solid #e2e8f0;text-align:right"><b>${Number(d.totaux.transferts).toLocaleString('fr-FR')} Ar</b></td></tr>
    <tr><td style="padding:6px;border:1px solid #e2e8f0">Reste à collecter</td><td style="padding:6px;border:1px solid #e2e8f0;text-align:right;color:#b45309"><b>${Number(d.totaux.reste).toLocaleString('fr-FR')} Ar</b></td></tr>
  </table>
  <p style="font-size:13px;color:#334155;margin-bottom:0">Cordialement,<br><b>${d.etab.nom}</b></p>`);
