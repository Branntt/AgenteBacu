// Prueba de navegador: anotar una idea con su brief.
//
// Cubre las cuatro preguntas que el usuario pidió al anotar —para quién es, en qué consiste,
// cómo se graba, qué espera— y que el botón para anotarla viva ÚNICAMENTE en la pestaña
// Clientes: es ahí donde se trabaja el contenido de cada cliente, y el resto de vistas
// (calendario, finanzas, etc.) se mantienen enfocadas en lo suyo sin ese botón.
//
// La base falsa rechaza las columnas del brief, como una cuenta que no corrió la migración:
// la idea tiene que guardarse igual y el brief quedar a salvo en el navegador.
//
// Necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/nueva-idea.e2e.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
// Base sin las columnas del brief, como la del usuario si no corre la migración.
const STUB = `
const CLAVE='__db_ideas';
const leer=()=>{try{return JSON.parse(localStorage.getItem(CLAVE))||[]}catch(e){return[]}};
const escribir=f=>localStorage.setItem(CLAVE,JSON.stringify(f));
window.__db={get ideas(){return leer()}};
const OPCIONALES=['cliente','consiste','como_grabar','que_espero'];
function q(tabla){
  const p=Promise.resolve({data: tabla==='ideas'?leer():(tabla==='clientes'?[{id:'c1',nombre:'Panadería La Espiga',documento:'900123456-7',estado:'activo'}]:[]), error:null});
  const o={select:()=>o,order:()=>o,eq:()=>o,neq:()=>o,update:()=>o,delete:()=>o,single:()=>o,
    insert:(filas)=>{const arr=Array.isArray(filas)?filas:[filas];
      if(tabla!=='ideas') return {then:a=>a({data:null,error:null})};
      if(arr.some(f=>OPCIONALES.some(c=>c in f))) return {then:a=>a({data:null,error:{message:'column does not exist'}})};
      escribir(leer().concat(arr)); return {then:a=>a({data:null,error:null})};},
    then:(a,b)=>p.then(a,b),catch:f=>p.catch(f)};
  return o;
}
export function createClient(){return{from:t=>q(t),channel:()=>({on(){return this},subscribe(){},unsubscribe(){}}),
  auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
  signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null})}};}
export const jsPDF=function(){return{}};
export default {createClient};
`;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args:['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', e => errores.push('💥 ' + e.message));
await ctx.route(/esm\.sh/, r => r.fulfill({ status:200, contentType:'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil:'networkidle' });
await page.waitForTimeout(1500);

let fallos = 0;
const ok = (n,c,x='') => { if(!c) fallos++; console.log((c?'✅ ':'❌ ')+n+(c?'':' '+x)); };

// El botón tiene que estar ÚNICAMENTE en la pestaña Clientes
const vistas = ['panorama','calendario','clientes','financiamiento','inventario','bienestar','metas','universidad','pared'];
const conBoton = [];
for (const v of vistas) {
  await page.evaluate(vv => { window.location.hash = '#'+vv; }, v);
  await page.waitForTimeout(200);
  if (await page.$('[data-act="nueva-idea"]')) conBoton.push(v);
}
ok('el botón de idea vive solo en Clientes', conBoton.length === 1 && conBoton[0] === 'clientes', `(aparece en: ${conBoton.join(', ')})`);

// Anotar una idea con su brief — desde Clientes, que es donde vive el botón
await page.evaluate(() => { window.location.hash = '#clientes'; });
await page.waitForTimeout(300);
await page.click('[data-act="nueva-idea"]');
await page.waitForTimeout(400);
const lista = await page.evaluate(() => {
  const dl = document.getElementById('lista-para-quien');
  return dl ? [...dl.options].map(o => o.value) : [];
});
ok('sugiere marcas propias y clientes', lista.includes('Brant') && lista.includes('Panadería La Espiga'), `(trae: ${lista.join(', ')})`);

await page.fill('#idea-titulo', 'Reel del detrás de cámaras');
await page.fill('#idea-para-quien', 'Panadería La Espiga');
await page.fill('#idea-consiste', 'Mostrar cómo amasan a las 4am');
await page.fill('#idea-como-grabar', 'A7 IV, luz natural, plano cerrado de las manos');
await page.fill('#idea-que-espero', 'Que la gente quiera ir a conocer el local');
await page.click('[data-act="nueva-idea-guardar"]');
await page.waitForTimeout(600);

await page.reload({ waitUntil:'networkidle' });
await page.waitForTimeout(1600);
const r = await page.evaluate(() => {
  const i = (window.__db?.ideas || [])[0];
  const st = window.__estado;
  return { guardadas: (window.__db?.ideas||[]).length, tituloEnBase: i?.titulo || null,
           briefEnBase: !!(i && (i.consiste || i.como_grabar)) };
});
ok('la idea sobrevive a la recarga', r.guardadas === 1, `(hay ${r.guardadas})`);
ok('guarda el título', r.tituloEnBase === 'Reel del detrás de cámaras', `(quedó "${r.tituloEnBase}")`);
ok('la base rechazó el brief (esperado sin migración)', r.briefEnBase === false);

// El brief se recupera del navegador
await page.evaluate(() => { window.location.hash = '#clientes'; });
await page.waitForTimeout(500);
// Clientes abre en la sub-vista "Clientes"; las ideas viven en "Tus marcas".
await page.click('[data-act="nav-go"][data-vista="marcas"]');
await page.waitForTimeout(600);
const enPantalla = await page.evaluate(() => (document.body.textContent||'').includes('Reel del detrás de cámaras'));
ok('la idea se ve después de recargar', enPantalla);
const brief = await page.evaluate(() => {
  const map = JSON.parse(localStorage.getItem('bacu.filas.campos_opcionales')||'{}');
  const ids = Object.keys(map.ideas || {});
  return ids.length ? map.ideas[ids[0]] : null;
});
ok('el brief no se perdió, quedó guardado', !!(brief && brief.consiste && brief.como_grabar && brief.que_espero), `(${JSON.stringify(brief)})`);
ok('sin errores en pantalla', errores.length === 0, errores.join(' | '));

await browser.close();
console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ ANOTAR UNA IDEA FUNCIONA');
process.exit(fallos ? 1 : 0);
