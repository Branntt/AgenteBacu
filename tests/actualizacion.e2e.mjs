// Prueba de navegador: que una publicación nueva llegue de verdad al dispositivo.
//
// Existe porque durante 17 publicaciones seguidas no llegó ninguna. Cambiar sw.js es lo
// ÚNICO que le avisa al navegador que hay versión nueva; como no se tocaba, el teléfono se
// quedó con la app del primer día. Y en un teléfono con la app en la pantalla de inicio no
// hay "recargar": el sistema la suspende y la devuelve tal cual.
//
// A diferencia de las otras pruebas de navegador, esta NO bloquea el service worker: es
// justamente lo que se está probando.
//
// Necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/actualizacion.e2e.mjs
import { chromium } from 'playwright';
const STUB = `
function q(){const p=Promise.resolve({data:[],error:null});
const o={select:()=>o,order:()=>o,eq:()=>o,neq:()=>o,update:()=>o,delete:()=>o,single:()=>o,insert:()=>o,then:(a,b)=>p.then(a,b),catch:f=>p.catch(f)};return o;}
export function createClient(){return{from:()=>q(),channel:()=>({on(){return this},subscribe(){},unsubscribe(){}}),
auth:{getSession:async()=>({data:{session:{user:{id:'u1',email:'a@b.co'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null})}};}
export const jsPDF=function(){return{}};export default {createClient};`;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args:['--no-sandbox'] });
// SIN bloquear el service worker: acá justamente se prueba que funcione
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', e => errores.push('💥 '+e.message));
await ctx.route(/esm\.sh/, r => r.fulfill({ status:200, contentType:'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil:'networkidle' });
await page.waitForTimeout(2500);

let fallos = 0;
const ok = (n,c,x='') => { if(!c) fallos++; console.log((c?'✅ ':'❌ ')+n+(c?'':' '+x)); };

// el service worker se registra y toma el control
const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return { registrado: !!reg, controlando: !!navigator.serviceWorker.controller };
});
ok('el service worker se registra', sw.registrado);
ok('toma el control de la página', sw.controlando);

// la versión se ve en Configuraciones, sin consola
await page.evaluate(() => { window.location.hash = '#configuraciones'; });
await page.waitForTimeout(600);
const v = await page.evaluate(() => document.getElementById('app-version-visible')?.textContent);
ok('la versión se ve en pantalla', /^v\d+/.test(v || ''), `(dice "${v}")`);
ok('el botón de buscar actualización existe', !!(await page.$('[data-act="buscar-actualizacion"]')));

// la caché quedó en la versión nueva y no sobrevive ninguna vieja
const caches = await page.evaluate(() => window.caches.keys());
ok('la caché es la nueva', caches.includes('agentebacu-shell-v4'), `(hay: ${caches.join(', ')})`);
ok('no queda ninguna caché vieja', !caches.some(c => c.includes('v3')), `(hay: ${caches.join(', ')})`);

// no se recarga en bucle en la primera instalación
const cargas = await page.evaluate(() => performance.getEntriesByType('navigation').length);
ok('no entra en bucle de recargas', cargas === 1, `(navegaciones: ${cargas})`);
ok('sin errores', errores.length === 0, errores.join(' | '));

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LA ACTUALIZACIÓN LLEGA AL DISPOSITIVO');
process.exit(fallos?1:0);
