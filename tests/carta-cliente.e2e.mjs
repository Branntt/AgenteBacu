// Prueba de navegador: la red de clientes y la carta completa.
//
// Comprueba lo que el usuario pidió ver: el hexágono de atributos con su animación, el
// global, lo que queda pendiente con ese cliente, la plantilla paso a paso marcando dónde
// va, y el historial de trabajos con lo que cobró por cada uno.
//
// Ojo con los selectores: esta vista NO está dentro de <main>, así que leer el texto desde
// document.querySelector('main') da falsos negativos — usar document.body.
//
// Necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/carta-cliente.e2e.mjs
import { chromium } from 'playwright';
const HOY = new Date().toISOString().slice(0,10);
const STUB = `
const CL=[{id:'c1',nombre:'Panadería La Espiga',documento:'900123456-7',estado:'proyecto_edicion'},
          {id:'c2',nombre:'Papelería Norte',estado:'por_pagar'},{id:'c3',nombre:'Cliente Nuevo',estado:'prospecto'}];
const CC=[{id:'a1',cliente_id:'c1',cliente_nombre:'Panadería La Espiga',total:1000000,pagada:true,fecha:'${HOY}',items:[{descripcion:'Reel de producto'}]},
          {id:'a2',cliente_id:'c1',cliente_nombre:'Panadería La Espiga',total:800000,pagada:true,fecha:'2026-06-10',items:[{descripcion:'Sesión de fotos'}]},
          {id:'b1',cliente_id:'c2',cliente_nombre:'Papelería Norte',total:300000,pagada:false,fecha:'2026-08-01',items:[{descripcion:'Cubrimiento'}]}];
const ID=[{id:'i1',cliente:'Panadería La Espiga',titulo:'Reel del detrás de cámaras',estado:'desarrollo',marca:'bacu',objetivos:[],preguntas:[null,null,null,null],formato:'Reel',etapa:0}];
function q(t){const d=t==='clientes'?CL:t==='cuentas_cobro'?CC:t==='ideas'?ID:[];
  const p=Promise.resolve({data:d,error:null});
  const o={select:()=>o,order:()=>o,eq:()=>o,neq:()=>o,update:()=>o,delete:()=>o,single:()=>o,insert:()=>o,then:(a,b)=>p.then(a,b),catch:f=>p.catch(f)};
  return o;}
export function createClient(){return{from:t=>q(t),channel:()=>({on(){return this},subscribe(){},unsubscribe(){}}),
  auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
  signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null})}};}
export const jsPDF=function(){return{}};
export default {createClient};
`;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args:['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers:'block' });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', e => errores.push('💥 ' + e.message));
await ctx.route(/esm\.sh/, r => r.fulfill({ status:200, contentType:'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil:'networkidle' });
await page.waitForTimeout(1500);

let fallos = 0;
const ok = (n,c,x='') => { if(!c) fallos++; console.log((c?'✅ ':'❌ ')+n+(c?'':' '+x)); };

await page.evaluate(() => { window.location.hash = '#clientes'; });
await page.waitForTimeout(700);

const red = await page.evaluate(() => {
  const cartas = [...document.querySelectorAll('.carta-mini')];
  return { n: cartas.length, orden: cartas.map(c => c.querySelector('.carta-mini-nombre')?.textContent.trim()),
           ovrs: cartas.map(c => +c.querySelector('.carta-mini-num')?.textContent) };
});
ok('la red muestra los 3 clientes', red.n === 3, `(muestra ${red.n})`);
ok('ordena por OVR, el mejor primero', red.orden[0] === 'Panadería La Espiga', `(primero: ${red.orden[0]})`);
ok('los OVR van de mayor a menor', red.ovrs.every((v,i)=> i===0 || v <= red.ovrs[i-1]), `(${red.ovrs.join(' > ')})`);

await page.click('.carta-mini');
await page.waitForTimeout(700);
const c = await page.evaluate(() => {
  const t = document.body.textContent || '';
  const hex = document.querySelector('.carta-hex-forma');
  return {
    ovr: document.querySelector('.carta-ovr-num')?.textContent.trim(),
    hexagono: !!hex && (hex.getAttribute('points')||'').split(' ').length === 6,
    barras: document.querySelectorAll('.carta-barra').length,
    pendienteIdea: t.includes('Reel del detrás de cámaras'),
    plan: document.querySelectorAll('.carta-paso').length,
    pasoActual: document.querySelector('.carta-paso-ahora .carta-paso-titulo')?.textContent.trim(),
    historial: document.querySelectorAll('.carta-hist-fila').length,
    cobro: t.includes('Reel de producto') && t.includes('$1.000.000'),
    animacion: hex ? getComputedStyle(hex).animationName : null,
    slider: !!document.querySelector('[data-change="cliente-influencia"]')
  };
});
ok('la carta muestra el OVR', /^\d+$/.test(c.ovr || ''), `(dio "${c.ovr}")`);
ok('dibuja el hexágono de 6 lados', c.hexagono);
ok('muestra las 6 barras de atributos', c.barras === 6, `(muestra ${c.barras})`);
ok('el hexágono tiene animación', c.animacion === 'crece-hex', `(dio ${c.animacion})`);
ok('lista lo pendiente con ese cliente', c.pendienteIdea);
ok('trae la plantilla de 7 pasos', c.plan === 7, `(trae ${c.plan})`);
ok('marca en qué paso va según su estado', c.pasoActual === 'Edición', `(marca "${c.pasoActual}")`);
ok('muestra el historial de trabajos', c.historial === 2, `(muestra ${c.historial})`);
ok('muestra cómo le cobró cada uno', c.cobro);
ok('deja ajustar la influencia', c.slider);

await page.evaluate(() => { const s=document.querySelector('[data-change="cliente-influencia"]'); s.value=95; s.dispatchEvent(new Event('change',{bubbles:true})); });
await page.waitForTimeout(600);
const infl = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.carta-barra')].find(x => x.textContent.includes('INF'));
  return b?.querySelector('.carta-barra-num')?.textContent.trim();
});
ok('subir la influencia cambia la carta', infl === '95', `(quedó ${infl})`);

await page.click('[data-act="carta-cerrar"]');
await page.waitForTimeout(500);
ok('se puede volver a la red', (await page.$$('.carta-mini')).length === 3);
ok('sin errores', errores.length === 0, errores.join(' | '));

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LA CARTA DE CLIENTE FUNCIONA');
process.exit(fallos?1:0);
