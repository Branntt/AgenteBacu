// Prueba de navegador del aviso rojo "No se pudo guardar el último cambio".
//
// Reproduce una cuenta cuya tabla metas_personales no tiene la columna `bloque`: la app
// siembra los hábitos con ese campo, el insert falla ENTERO, y como las semillas nunca
// quedan guardadas se vuelve a intentar en cada carga — aviso rojo permanente y hábitos que
// no persisten. Es el fallo que reportó el usuario, con ese texto exacto.
//
// Necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/guardado.e2e.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const STUB = fs.readFileSync(new URL('./_doble-supabase-sin-bloque.js', import.meta.url), 'utf8');

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.route(/esm\.sh/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const r = await page.evaluate(() => ({
  intentos: (window.__intentos || []).filter(i => i.tabla === 'metas_personales'),
  banner: !!document.querySelector('.save-error-banner'),
  texto: document.querySelector('.save-error-banner')?.textContent?.trim() || null
}));

let fallos = 0;
const ok = (n, c) => { if (!c) fallos++; console.log((c ? '✅ ' : '❌ ') + n); };
console.log('intentos de guardar hábitos:', JSON.stringify(r.intentos));
ok('intenta primero con bloque', r.intentos[0]?.bloque === true);
ok('reintenta sin bloque cuando falla', r.intentos[1]?.bloque === false);
ok('el reintento lleva las mismas filas', r.intentos[0]?.n === r.intentos[1]?.n);
ok('no queda el aviso rojo', r.banner === false);
if (r.banner) console.log('   el aviso dice:', r.texto);

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LOS HÁBITOS SE GUARDAN SIN LA MIGRACIÓN');
process.exit(fallos ? 1 : 0);
