// Contrôle qualité visuel : captures desktop + mobile des pages principales.
import puppeteer from 'puppeteer';

const navigateur = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await navigateur.newPage();
page.setDefaultTimeout(30000);

// --- Desktop ---
await page.setViewport({ width: 1366, height: 850 });
await page.goto('http://localhost:5173/cotisations', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: '/tmp/qa-cotisations-desktop.png' });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/qa-dashboard-desktop.png' });

// --- Mobile (iPhone 12 ~ 390x844) ---
const mobile = await navigateur.newPage();
await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await mobile.goto('http://localhost:5173/cotisations', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 900));
await mobile.screenshot({ path: '/tmp/qa-cotisations-mobile.png' });

// menu burger ouvert
await mobile.tap('.burger');
await new Promise(r => setTimeout(r, 500));
await mobile.screenshot({ path: '/tmp/qa-menu-mobile.png' });

// modale de paiement avec calcul auto (desktop)
await page.goto('http://localhost:5173/cotisations', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
const boutons = await page.$$('table .btn-mini');
if (boutons[0]) { await boutons[0].click(); await new Promise(r => setTimeout(r, 500));
  await page.type('input[type="number"]', '300000');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/qa-modal-paiement.png' });
}
await navigateur.close();
console.log('✅ Captures QA effectuées');
