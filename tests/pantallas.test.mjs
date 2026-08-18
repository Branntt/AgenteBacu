// Arma cada pantalla con datos realistas y verifica que ninguna lance.
// `node tests/pantallas.test.mjs` desde la carpeta tests/.
//
// Existe porque Panorama estallaba para todo el mundo — leía `m.nombre` en unas filas cuyo
// campo se llama `titulo`, así que era `undefined.substring(...)` — y ninguna prueba lo
// tocaba. Las semillas de "Mejora de equipo" que la app inserta sola entran en ese listado,
// o sea que el fallo saltaba con la app recién estrenada.
//
// Inventario queda fuera a propósito: arrastra un import a un CDN por su visor 3D y no se
// puede cargar sin red. Se cubre en la prueba de navegador (ver README de tests).
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k,v) => mem.set(k,String(v)), removeItem: k => mem.delete(k), key: i => [...mem.keys()][i] ?? null, get length(){return mem.size;} };

const { hoyStr, lunesDe, mesActual } = await import('../src/lib/idea.js');
const hoy = hoyStr();
let fallos = 0;

const VISTAS = ['panorama','calendario','clientes','financiamiento','bienestar','metas','universidad','pared','configuraciones'];
const mods = {};
for (const v of VISTAS) {
  const m = await import(`../src/views/${v}.js`);
  mods[v] = m[Object.keys(m).find(k => k.startsWith('render'))];
}

const base = {
  view:'panorama', month:mesActual(), ideas:[], snaps:[], clientes:[], deudas:[], cuentasCobro:[],
  pagosMensuales:[], tareas:[], metasPersonales:[], metasMensuales:[], equipoProduccion:[],
  transacciones:[], movimientosFinanciamiento:[], presupuesto:{}, gastosVivirSolo:[], gastosRecurrentes:[],
  diaSeleccionadoBienestar:hoy, semanaSeleccionadaBienestar:lunesDe(hoy), semanaInicio:lunesDe(hoy),
  finanzasVista:'dia', invVista:'personal', clientesVista:'externos', calVista:'mes',
  filtroCalendario:'todas', filtroGuiones:'todas', guionesVista:'general', uniBloquesAbiertos:{}, tema:'Cine crudo'
};

const conDatos = { ...base,
  ideas:[{id:'i1',titulo:'Reel',marca:'brant',estado:'edicion',prioridad:'Alta',fecha:null,fechaRodaje:null,objetivos:[],preguntas:[null,null,null,null],formato:'Reel',etapa:0}],
  clientes:[{id:'c1',nombre:'Cliente',estado:'por_pagar',precio:500000}],
  deudas:[{id:'d1',direccion:'debo',monto:20000,pagada:false,persona:'Andre'}],
  tareas:[{id:'t1',hecha:false,fecha:hoy,texto:'algo',columna:'Hoy'}],
  transacciones:[{id:'tr1',fecha:hoy,descripcion:'almuerzo',monto:15000,tipo:'gasto',fuente:'nequi',categoria:'comida'}],
  metasPersonales:[
    {id:'h1',categoria:'habito',titulo:'no smoking',bloque:'manana',fecha:hoy,cumplida:false},
    // Las que tumbaban Panorama: no son hábitos ni inventario, así que caen en "Metas activas".
    {id:'s1',categoria:'camara',titulo:'Sony A7 IV',cumplida:false},
    {id:'m1',categoria:'meta',titulo:'Ahorrar para el lente',cumplida:false,pasos:[{texto:'a',hecho:true},{texto:'b',hecho:false}]},
    // Sin título: no puede tumbar la pantalla, tiene que mostrar algo en su lugar.
    {id:'m2',categoria:'meta',titulo:undefined,cumplida:false}
  ]
};

for (const [etiqueta, estado] of [['vacía', base], ['con datos', conDatos]]) {
  console.log(`\n--- app ${etiqueta} ---`);
  for (const v of VISTAS) {
    try {
      const html = mods[v]({ ...estado, view: v });
      if (/undefined|NaN/.test(html)) { fallos++; console.log(`⚠️  ${v}: arma pero con undefined/NaN`); }
      else console.log(`✅ ${v}`);
    } catch (e) { fallos++; console.log(`❌ ${v} -> ${e.constructor.name}: ${e.message}`); }
  }
}

console.log(fallos === 0 ? '\n✅ NINGUNA PANTALLA ESTALLA' : `\n❌ ${fallos} FALLAN`);
process.exit(fallos ? 1 : 0);
