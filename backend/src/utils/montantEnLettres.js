// Conversion d'un montant en lettres (français) pour les reçus PDF.
const UNITS = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix',
  'onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
const TENS = [,'dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];

function sousMille(n) {
  if (n < 20) return UNITS[n];
  const d = Math.floor(n / 10), u = n % 10;
  if (d === 7 || d === 9) { // soixante-dix / quatre-vingt-dix
    const base = d === 7 ? 'soixante' : 'quatre-vingt';
    return base + (d === 7 && u === 0 ? '-dix' : '-' + UNITS[10 + u]);
  }
  let mot = TENS[d];
  if (d === 8 && u === 0) mot += 's';
  if (u === 1 && d !== 8) return mot + '-et-un';
  return u ? mot + '-' + UNITS[u] : mot;
}

function enLettres(n) {
  if (n === 0) return 'zéro';
  const echelles = [[1e9,'milliard'],[1e6,'million'],[1e3,'mille']];
  let reste = n, mots = [];
  for (const [valeur, nom] of echelles) {
    const q = Math.floor(reste / valeur);
    if (q > 0) {
      if (nom === 'mille') mots.push(q === 1 ? 'mille' : sousMille(q) + ' mille');
      else mots.push(sousMille(q) + ' ' + nom + (q > 1 ? 's' : ''));
      reste %= valeur;
    }
  }
  if (reste > 0) mots.push(sousMille(reste));
  return mots.join(' ');
}

export const montantEnLettres = (n) => {
  const entier = Math.floor(Number(n));
  return entier.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
export const enLettresAr = (n) => {
  const c = enLettres(Math.floor(Number(n)));
  return c.charAt(0).toUpperCase() + c.slice(1) + ' Ariary';
};
