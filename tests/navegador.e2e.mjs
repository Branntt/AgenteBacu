// Prueba de navegador: levanta la app entera en Chromium, con un doble de Supabase, y la
// recorre pestaña por pestaña haciendo clicks de verdad.
//
// Es la única de las tres que corre el código como lo corre el usuario, y por eso encontró
// dos cosas que las pruebas de Node no podían ver: un bucle infinito de recargas del service
// worker (la app arrancaba, cargaba los datos y se recargaba antes de dibujar) y el fallo de
// Panorama con su traza completa.
//
// No corre sola: necesita `npm i playwright` aparte y el servidor local levantado:
//   python3 devserver.py 8777 .
//   node tests/navegador.e2e.mjs
import { chromium } from 'playwright';

const hoy = new Date().toISOString().slice(0,10);
const DATOS = {
  metas_personales: [
    {id:'h1',categoria:'habito',titulo:'no smoking',bloque:'manana',fecha:hoy,cumplida:false},
    {id:'h2',categoria:'habito',titulo:'Ir al gym / ejercicio',bloque:'dia',fecha:null,cumplida:false},
    {id:'h3',categoria:'habito',titulo:'Dormir 7–9 horas',bloque:'noche',fecha:null,cumplida:false}
  ],
  ideas: [{id:'i1',titulo:'Reel',marca:'brant',estado:'edicion',prioridad:'Alta',fecha:null,fecha_rodaje:null,objetivos:[],preguntas:[null,null,null,null],formato:'Reel',etapa:0}],
  clientes: [{id:'c1',nombre:'Cliente',estado:'por_pagar',precio:500000}],
  deudas: [{id:'d1',direccion:'debo',monto:20000,pagada:false,persona:'Andre'}],
  transacciones: [{id:'tr1',fecha:hoy,descripcion:'almuerzo',monto:15000,tipo:'gasto',fuente:'nequi',categoria:'comida'}],
  tareas: [{id:'t1',hecha:false,fecha:hoy,texto:'algo',columna:'Hoy'}]
};

const STUB = `
const DATOS = ${JSON.stringify(DATOS)};
function q(tabla){
  const p = Promise.resolve({ data: DATOS[tabla] || [], error: null });
  const o = { select:()=>o, order:()=>o, eq:()=>o, neq:()=>o, insert:()=>o, update:()=>o,
              delete:()=>o, single:()=>o, then:(a,b)=>p.then(a,b), catch:(f)=>p.catch(f) };
  return o;
}
export function createClient(){
  return {
    from: (t) => q(t),
    channel: () => ({ on: function(){ return this; }, subscribe: ()=>{}, unsubscribe: ()=>{} }),
    auth: {
      getSession: async () => ({ data: { session: { user: { id:'u1', email:'test@test.co' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => ({ error: null })
    }
  };
}
export const jsPDF = function(){ return {}; };
export default { createClient };
`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args:['--no-sandbox'] });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', e => errores.push('💥 ' + e.message));
page.on('console', m => { const t = m.text(); if(!t.includes('frame-ancestors')) console.log('  [nav]', m.type()+':', t.slice(0,150));
  if (m.type()==='error' && !t.includes('frame-ancestors') && !t.includes('net::')) errores.push('console: ' + t); });

await page.route(/esm\.sh/, r => r.fulfill({ status:200, contentType:'application/javascript', body: STUB }));
await page.goto('http://localhost:8777/index.html', { waitUntil:'networkidle' });
await page.waitForTimeout(1200);

const version = await page.evaluate(() => {
  const l = performance.getEntriesByType('resource').length; return l;
});
console.log('=== arranque ===');
const hayApp = await page.evaluate(() => !!document.querySelector('.app-root'));
console.log(hayApp ? '✅ la app arranca y dibuja' : '❌ la app no dibujó nada');
if (errores.length) console.log('errores de arranque:\n' + errores.join('\n'));
if (!hayApp) console.log('  body:', (await page.evaluate(()=>document.body.innerHTML)).slice(0,300));

console.log('\n=== recorriendo las pestañas como el usuario ===');
const vistas = ['panorama','calendario','clientes','financiamiento','inventario','bienestar','metas','universidad','pared'];
let rotas = 0;
for (const v of vistas) {
  const antes = errores.length;
  await page.evaluate(vv => { window.location.hash = '#' + vv; }, v);
  await page.waitForTimeout(350);
  const info = await page.evaluate(() => ({
    falloVista: !!document.body.textContent.includes('Esta pantalla falló al abrir'),
    avisoGlobal: !!document.querySelector('[role="alert"][style*="position:fixed"]'),
    largo: (document.querySelector('main')?.textContent || '').trim().length
  }));
  const nuevos = errores.slice(antes);
  const mal = info.falloVista || nuevos.length > 0 || info.largo < 20;
  if (mal) { rotas++; console.log(`❌ ${v}${info.falloVista?' (mostró la pantalla de error)':''}${info.largo<20?' (quedó vacía)':''} ${nuevos.join(' | ')}`); }
  else console.log(`✅ ${v} (${info.largo} caracteres de contenido)`);
}

// Marcar un habito de verdad, con click real
console.log('\n=== marcando un hábito con click real ===');
await page.evaluate(() => { window.location.hash = '#bienestar'; });
await page.waitForTimeout(400);
const antesClick = errores.length;
const check = await page.$('[data-act="habito-toggle"]');
if (check) {
  await check.click();
  await page.waitForTimeout(400);
  const racha = await page.evaluate(() => document.querySelector('.bh-streak')?.textContent?.trim() || 'sin racha visible');
  const nuevos = errores.slice(antesClick);
  console.log(nuevos.length ? `❌ el click lanzó: ${nuevos.join(' | ')}` : `✅ el click funciona — racha: ${racha}`);
  if (nuevos.length) rotas++;
} else { console.log('❌ no encontré el botón de marcar hábito'); rotas++; }


// ---- Pendientes de Universidad ----
console.log('\n=== pendientes de universidad ===');
await page.evaluate(() => { window.location.hash = '#universidad'; });
await page.waitForTimeout(400);
const antesU = errores.length;
await page.fill('#uni-pend-materia', 'Cálculo — Prof. Ramírez');
await page.fill('#uni-pend-texto', 'Entregar taller 3');
await page.fill('#uni-pend-fecha', new Date(Date.now()+86400000).toISOString().slice(0,10));
await page.click('[data-act="pendiente-uni-nuevo"]');
await page.waitForTimeout(400);
await page.fill('#uni-pend-texto', 'Leer capítulo 5');
await page.click('[data-act="pendiente-uni-nuevo"]');
await page.waitForTimeout(400);
const u = await page.evaluate(() => {
  const t = document.querySelector('main').textContent;
  return {
    materia: t.includes('Cálculo — Prof. Ramírez'),
    act1: t.includes('Entregar taller 3'),
    act2: t.includes('Leer capítulo 5'),
    contador: t.includes('Pendientes de clase — 2'),
    materiaSigue: document.querySelector('#uni-pend-materia')?.value === 'Cálculo — Prof. Ramírez',
    textoLimpio: document.querySelector('#uni-pend-texto')?.value === ''
  };
});
const okU = Object.entries(u).filter(([k,v]) => !v).map(([k]) => k);
console.log(okU.length ? `❌ falla: ${okU.join(', ')}` : '✅ agrega pendientes, los agrupa por materia y limpia el campo');
// marcar uno como hecho
await page.click('[data-act="tarea-toggle"]');
await page.waitForTimeout(400);
const hecho = await page.evaluate(() => document.querySelector('main').textContent.includes('Ya hechas'));
console.log(hecho ? '✅ se puede marcar como hecha' : '❌ marcar como hecha no movió nada');
// borrar uno
const antesBorrar = await page.$$eval('[data-act="tarea-eliminar"]', e => e.length);
await page.click('[data-act="tarea-eliminar"]');
await page.waitForTimeout(400);
const despues = await page.$$eval('[data-act="tarea-eliminar"]', e => e.length);
console.log(despues === antesBorrar - 1 ? '✅ se puede borrar' : `❌ borrar no funcionó (${antesBorrar} -> ${despues})`);
const nuevosU = errores.slice(antesU);
if (nuevosU.length) console.log('❌ errores:', nuevosU.join(' | '));
if (okU.length || !hecho || nuevosU.length) rotas++;

console.log('\n' + (rotas || errores.length ? `❌ ${rotas} pantallas con problemas, ${errores.length} errores` : '✅ TODA LA APP FUNCIONA EN NAVEGADOR'));
await browser.close();
process.exit(rotas ? 1 : 0);
