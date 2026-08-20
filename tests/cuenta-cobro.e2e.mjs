// Prueba de navegador: llegar a la cuenta de cobro desde donde estés.
//
// El usuario tenía la ficha del cliente —con su botón de cuenta de cobro— y dos sitios más
// que no llevaban a ella: la Red, que quedaba como un tercer lugar sin salida, y Rodaje
// rápido, donde había que agendar, ir a Clientes y buscar al cliente para cobrarle.
//
// Necesita `npm i playwright` y el servidor local: python3 devserver.py 8777 .
import { chromium } from 'playwright';

const HOY = new Date().toISOString().slice(0, 10);
const STUB = `
const CL=[{id:'c1',nombre:'PRIMAL BRAND SAS',documento:'902.037.119-1',estado:'prospecto',proyecto:'Evento Ecomers'}];
const CC=[{id:'a1',cliente_id:'c1',cliente_nombre:'PRIMAL BRAND SAS',total:450000,pagada:false,fecha:'${HOY}',items:[{descripcion:'Cubrimiento'}]}];
function q(t){const d=t==='clientes'?CL:t==='cuentas_cobro'?CC:[];const p=Promise.resolve({data:d,error:null});
const o={select:()=>o,order:()=>o,eq:()=>o,neq:()=>o,update:()=>o,delete:()=>o,single:()=>o,insert:()=>o,then:(a,b)=>p.then(a,b),catch:f=>p.catch(f)};return o;}
export function createClient(){return{from:t=>q(t),channel:()=>({on(){return this},subscribe(){},unsubscribe(){}}),
auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null})}};}
export const jsPDF=function(){return{}};export default {createClient};`;

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', e => errores.push('💥 ' + e.message));
await ctx.route(/esm\.sh/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

let fallos = 0;
const ok = (n, c, x = '') => { if (!c) fallos++; console.log((c ? '✅ ' : '❌ ') + n + (c ? '' : ' ' + x)); };
const hayCuentaCobro = () => page.evaluate(() => !!document.querySelector('[data-act="cc-generar"]'));

// --- Desde la carta, en la Red ---
await page.evaluate(() => { window.location.hash = '#clientes'; });
await page.waitForTimeout(700);
await page.click('.carta-mini');
await page.waitForTimeout(600);
ok('la carta ofrece editar los datos', !!(await page.$('[data-act="cliente-abrir"]')));
ok('la carta muestra las cuentas de cobro del cliente', !!(await page.$('.cuentas-cliente')));
const enCarta = await page.evaluate(() => {
  const b = document.querySelector('.cuentas-cliente');
  return { total: b.textContent.includes('$450.000'), anterior: b.textContent.includes('PDF'), nueva: !!b.querySelector('[data-act="cc-abrir"]') };
});
ok('con el total facturado', enCarta.total);
ok('y las anteriores descargables', enCarta.anterior);
ok('y el botón de hacer una nueva', enCarta.nueva);

await page.click('.cuentas-cliente [data-act="cc-abrir"]');
await page.waitForTimeout(600);
ok('desde la carta se abre la cuenta de cobro', await hayCuentaCobro());
const conDatos = await page.evaluate(() => document.querySelector('[data-campo="clienteNombre"]')?.value);
ok('llega con el cliente puesto', conDatos === 'PRIMAL BRAND SAS', `(dice "${conDatos}")`);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// --- Desde la ficha del cliente (el formulario de siempre) ---
await page.click('[data-act="cliente-abrir"]');
await page.waitForTimeout(600);
ok('desde la carta se abre la ficha', !!(await page.$('[data-change="cliente-nombre"]')));
const enFicha = await page.evaluate(() => {
  const b = document.querySelector('.drawer .cuentas-cliente');
  return { hay: !!b, total: b?.textContent.includes('$450.000'), pdf: !!b?.querySelector('[data-act="cc-historial-descargar"]') };
});
ok('la ficha muestra el mismo bloque de cuentas', enFicha.hay);
ok('con el total y la cuenta anterior descargable', enFicha.total && enFicha.pdf);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// --- Desde Rodaje rápido ---
await page.evaluate(() => { window.location.hash = '#calendario'; });
await page.waitForTimeout(500);
await page.click('[data-act="rodaje-rapido-abrir"]');
await page.waitForTimeout(500);
ok('sin cliente escrito no muestra cuentas', !(await page.$('.rodaje-rapido .cuentas-cliente')));

await page.fill('[data-campo="empresa"]', 'PRIMAL BRAND SAS');
await page.dispatchEvent('[data-campo="empresa"]', 'change');
await page.waitForTimeout(600);
const r = await page.evaluate(() => {
  const b = document.querySelector('.rodaje-rapido .cuentas-cliente');
  return { boton: !!b?.querySelector('[data-act="cc-abrir"]'), facturado: !!b?.textContent.includes('$450.000'),
           pdf: !!b?.querySelector('[data-act="cc-historial-descargar"]'),
           documento: document.querySelector('[data-campo="documento"]')?.value };
});
ok('al reconocer al cliente muestra el mismo bloque', r.boton);
ok('con lo que le tiene facturado', r.facturado);
ok('y sus cuentas anteriores descargables', r.pdf);
ok('y le pone su NIT solo', r.documento === '902.037.119-1', `(quedó "${r.documento}")`);

await page.click('.rodaje-rapido .cuentas-cliente [data-act="cc-abrir"]');
await page.waitForTimeout(600);
ok('desde el rodaje se abre la cuenta de cobro', await hayCuentaCobro());
const visible = await page.evaluate(() => {
  const cc = [...document.querySelectorAll('.drawer-overlay')].find(o => o.querySelector('[data-act="cc-generar"]'));
  return cc ? cc === document.querySelectorAll('.drawer-overlay')[document.querySelectorAll('.drawer-overlay').length - 1] : false;
});
ok('la cuenta de cobro queda encima, no tapada por el rodaje', visible);
ok('sin errores', errores.length === 0, errores.join(' | '));

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LA CUENTA DE COBRO SE ALCANZA DESDE TODOS LADOS');
process.exit(fallos ? 1 : 0);
