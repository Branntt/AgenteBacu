// Prueba de navegador: un pendiente de clase NO se puede perder.
//
// Reproduce el fallo que sufrió el usuario: la columna `materia` no existe en su base, el
// insert fallaba ENTERO, el pendiente quedaba solo en memoria y desaparecía al recargar.
// Perdió dos trabajos así.
//
// Dos cosas que esta prueba necesita para no mentir, y que costaron encontrar:
//   - La base falsa vive en localStorage, no en una variable: si se reinicia con la página,
//     "se perdió" sale siempre, aunque el guardado funcione.
//   - El service worker va bloqueado: si no, intercepta la recarga, la app no arranca y
//     todo parece perdido por un motivo que no es el que se está probando.
//
// Necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/pendientes-uni.e2e.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const STUB = fs.readFileSync(new URL('./_doble-supabase-sin-materia.js', import.meta.url), 'utf8');
const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--no-sandbox']
});
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const page = await ctx.newPage();
await ctx.route(/esm\.sh/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.evaluate(() => { window.location.hash = '#universidad'; });
await page.waitForTimeout(400);
for (const [materia, actividad] of [['Guion — Prof. Díaz', 'Entregar escaleta'], ['Cálculo', 'Taller 3']]) {
  await page.fill('#uni-pend-materia', materia);
  await page.fill('#uni-pend-texto', actividad);
  await page.click('[data-act="pendiente-uni-nuevo"]');
  await page.waitForTimeout(350);
}

let fallos = 0;
const ok = (n, c, extra = '') => { if (!c) fallos++; console.log((c ? '✅ ' : '❌ ') + n + (c ? '' : ' ' + extra)); };
ok('se ven al agregarlos', await page.evaluate(() => (document.querySelector('main')?.textContent || '').includes('Entregar escaleta')));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => { window.location.hash = '#universidad'; });
await page.waitForTimeout(600);

const r = await page.evaluate(() => {
  const t = document.querySelector('main')?.textContent || '';
  return { uno: t.includes('Entregar escaleta'), dos: t.includes('Taller 3'),
           materia: t.includes('Guion — Prof. Díaz'), enBase: (window.__db?.tareas || []).length };
});
ok('el primero sobrevive a la recarga', r.uno);
ok('el segundo sobrevive a la recarga', r.dos);
ok('los dos llegaron a la base', r.enBase === 2, `(llegaron ${r.enBase} de 2)`);
ok('la materia se sigue viendo, aunque la base no la acepte', r.materia);

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN — un pendiente se puede perder` : '\n✅ NINGÚN PENDIENTE SE PIERDE');
process.exit(fallos ? 1 : 0);
