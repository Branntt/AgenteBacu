// Las estadísticas de la carta de un cliente: que los números signifiquen algo.
// `node tests/cliente-stats.test.mjs` desde la carpeta tests/.
//
// Los atributos son relativos a la propia cartera —el que más te ha pagado marca el 99— así
// que lo que se comprueba acá es sobre todo eso: que el mejor lidere, que quien debe plata
// baje en puntualidad, que un año de silencio hunda la actividad, y que un cliente sin un
// solo trabajo no reviente ni salga con números inventados.
const mem = new Map();
globalThis.localStorage = { getItem:k=>mem.get(k)??null, setItem:(k,v)=>mem.set(k,String(v)), removeItem:k=>mem.delete(k), key:i=>[...mem.keys()][i]??null, get length(){return mem.size;} };
const { calcularRedClientes, rangoDeCliente } = await import('../src/lib/clienteStats.js');

const HOY = '2026-08-20';
const clientes = [
  { id:'c1', nombre:'Panadería La Espiga' },
  { id:'c2', nombre:'Papelería Norte' },
  { id:'c3', nombre:'Cliente Nuevo' },
  { id:'c4', nombre:'Cliente Viejo', influencia: 90 }
];
const cc = [
  // La Espiga: 3 trabajos, todo pagado, el último reciente
  { id:'a1', cliente_id:'c1', total:1000000, pagada:true, fecha:'2026-08-15' },
  { id:'a2', cliente_id:'c1', total:800000,  pagada:true, fecha:'2026-06-10' },
  { id:'a3', cliente_id:'c1', total:600000,  pagada:true, fecha:'2026-03-01' },
  // Papelería: 2 trabajos, uno sin cobrar
  { id:'b1', cliente_id:'c2', total:300000, pagada:true,  fecha:'2026-07-01' },
  { id:'b2', cliente_id:'c2', total:300000, pagada:false, fecha:'2026-08-01' },
  // Viejo: mucha plata pero hace un año
  { id:'d1', cliente_id:'c4', total:900000, pagada:true, fecha:'2025-08-20' }
];
const ideas = [{ id:'i1', cliente:'Panadería La Espiga', titulo:'Reel' }];

const red = calcularRedClientes(clientes, cc, ideas, HOY);
let fallos = 0;
const ok = (n,c,x='') => { if(!c) fallos++; console.log((c?'✅ ':'❌ ')+n+(c?'':' '+x)); };
const de = n => red.find(r => r.cliente.nombre === n);

console.log(red.map(r => `${r.cliente.nombre}: OVR ${r.attrs.global} ${rangoDeCliente(r.attrs.global).emoji} (dinero ${r.attrs.dinero}, vol ${r.attrs.volumen}, act ${r.attrs.actividad}, punt ${r.attrs.puntualidad})`).join('\n'));

const espiga = de('Panadería La Espiga'), pape = de('Papelería Norte'), nuevo = de('Cliente Nuevo'), viejo = de('Cliente Viejo');
ok('el que más paga lidera la red', red[0].cliente.nombre === 'Panadería La Espiga', `(lidera ${red[0].cliente.nombre})`);
ok('el mejor en dinero marca el tope', espiga.attrs.dinero === 99, `(dio ${espiga.attrs.dinero})`);
ok('suma bien lo cobrado', espiga.cobrado === 2400000, `(dio ${espiga.cobrado})`);
ok('separa lo que falta por cobrar', pape.porCobrar === 300000, `(dio ${pape.porCobrar})`);
ok('cuenta los trabajos', espiga.trabajos === 3, `(dio ${espiga.trabajos})`);
ok('cuenta las ideas del cliente', espiga.ideas.length === 1);
ok('puntualidad baja si debe plata', pape.attrs.puntualidad < espiga.attrs.puntualidad, `(${pape.attrs.puntualidad} vs ${espiga.attrs.puntualidad})`);
ok('actividad alta si es reciente', espiga.attrs.actividad > 90, `(dio ${espiga.attrs.actividad})`);
ok('actividad al piso tras un año', viejo.attrs.actividad <= 5, `(dio ${viejo.attrs.actividad})`);
ok('cliente sin trabajos no revienta', nuevo.attrs.global >= 1 && nuevo.trabajos === 0);
ok('influencia manual se respeta', viejo.attrs.influencia === 90, `(dio ${viejo.attrs.influencia})`);
ok('influencia por defecto es la mitad', espiga.attrs.influencia === 50);
ok('todos los atributos entre 1 y 99', red.every(r => Object.values(r.attrs).every(v => v >= 1 && v <= 99)));
ok('cartera vacía no revienta', calcularRedClientes([], [], [], HOY).length === 0);
ok('rangos ordenados', rangoDeCliente(90).nombre==='Leyenda' && rangoDeCliente(20).nombre==='Nuevo');

console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LAS ESTADÍSTICAS CUADRAN');
process.exit(fallos?1:0);
