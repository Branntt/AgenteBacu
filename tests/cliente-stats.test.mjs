// Las seis formas en que un cliente te beneficia, y el global que sale de ellas.
// `node tests/cliente-stats.test.mjs` desde la carpeta tests/.
//
// Antes cuatro de los seis se calculaban de las facturas, y un cliente recién agregado salía
// con todo en 1 porque aún no tenía nada facturado: la carta lo mostraba como el peor
// cliente del mundo cuando en realidad no se sabía nada de él. Ahora los seis los pone el
// usuario y arrancan en la mitad. Lo cobrado y los trabajos se siguen calculando de las
// tablas, pero como hechos aparte, no como nota.
const mem = new Map();
globalThis.localStorage = { getItem:k=>mem.get(k)??null, setItem:(k,v)=>mem.set(k,String(v)), removeItem:k=>mem.delete(k), key:i=>[...mem.keys()][i]??null, get length(){return mem.size;} };
const { calcularRedClientes, rangoDeCliente, BENEFICIOS } = await import('../src/lib/clienteStats.js');

const HOY = '2026-08-20';
const clientes = [
  { id:'c1', nombre:'Panadería La Espiga', beneficios:{ dinero:90, puertas:80, portafolio:85, aprendizaje:60, constancia:75, trato:70 } },
  { id:'c2', nombre:'Papelería Norte', beneficios:{ dinero:20, puertas:30 } },
  { id:'c3', nombre:'Cliente Nuevo' }
];
const cc = [
  { id:'a1', cliente_id:'c1', total:1000000, pagada:true,  fecha:'2026-08-15', items:[{descripcion:'Reel'}] },
  { id:'a2', cliente_id:'c1', total:800000,  pagada:true,  fecha:'2026-06-10' },
  { id:'b1', cliente_id:'c2', total:300000,  pagada:false, fecha:'2026-08-01' }
];
const ideas = [{ id:'i1', cliente:'Panadería La Espiga', titulo:'Reel' }];

const red = calcularRedClientes(clientes, cc, ideas, HOY);
let fallos = 0;
const ok = (n,c,x='') => { if(!c) fallos++; console.log((c?'✅ ':'❌ ')+n+(c?'':' '+x)); };
const de = n => red.find(r => r.cliente.nombre === n);
console.log(red.map(r => `${r.cliente.nombre}: ${r.attrs.global} ${rangoDeCliente(r.attrs.global).emoji}`).join('\n'));

const espiga = de('Panadería La Espiga'), pape = de('Papelería Norte'), nuevo = de('Cliente Nuevo');
ok('son seis beneficios', BENEFICIOS.length === 6, `(hay ${BENEFICIOS.length})`);
ok('el global es el promedio de los seis', espiga.attrs.global === Math.round((90+80+85+60+75+70)/6), `(dio ${espiga.attrs.global})`);
ok('el mejor valorado lidera', red[0].cliente.nombre === 'Panadería La Espiga', `(lidera ${red[0].cliente.nombre})`);
ok('un cliente sin valorar arranca en la mitad', nuevo.attrs.global === 50, `(dio ${nuevo.attrs.global})`);
ok('los seis de un cliente nuevo están en 50', BENEFICIOS.every(([c]) => nuevo.attrs[c] === 50));
ok('lo que se valoró a medias respeta lo puesto', pape.attrs.dinero === 20 && pape.attrs.puertas === 30);
ok('lo que falta por valorar queda en la mitad', pape.attrs.portafolio === 50 && pape.attrs.trato === 50);
ok('todos los valores entre 1 y 99', red.every(r => BENEFICIOS.every(([c]) => r.attrs[c] >= 1 && r.attrs[c] <= 99)));

// Los hechos se siguen calculando de las tablas
ok('suma lo cobrado', espiga.cobrado === 1800000, `(dio ${espiga.cobrado})`);
ok('separa lo que falta por cobrar', pape.porCobrar === 300000, `(dio ${pape.porCobrar})`);
ok('cuenta los trabajos', espiga.trabajos === 2, `(dio ${espiga.trabajos})`);
ok('cuenta las ideas del cliente', espiga.ideas.length === 1);
ok('cartera vacía no revienta', calcularRedClientes([], [], [], HOY).length === 0);
ok('rangos ordenados', rangoDeCliente(90).nombre==='Leyenda' && rangoDeCliente(20).nombre==='Nuevo');

console.log(fallos ? `\n❌ ${fallos} FALLAN` : '\n✅ LOS SEIS BENEFICIOS CUADRAN');
process.exit(fallos?1:0);
