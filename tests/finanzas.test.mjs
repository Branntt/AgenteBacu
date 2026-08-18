// Pruebas de humo, sin dependencias: `node tests/<archivo>` desde la carpeta tests/.
// Existen porque una variable renombrada dejó tres referencias muertas en bienestar.js,
// Bienestar dejó de abrir en producción y nadie se enteró hasta que el usuario lo reportó.
// La regla que imponen: toda función exportada corre sin lanzar, y la pantalla se arma.
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  key: i => Array.from(store.keys())[i] ?? null,
  get length() { return store.size; }
};

const { calcularFinanciamiento } = await import('../src/lib/financiamiento.js');
const { renderFinanciamiento } = await import('../src/views/financiamiento.js');
const { hoyStr } = await import('../src/lib/idea.js');

const hoy = hoyStr();
const mes = hoy.slice(0, 7);
let fallos = 0;
const check = (n, real, esp) => {
  const ok = real === esp;
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} ${n}: ${real}${ok ? '' : ` (esperaba ${esp})`}`);
};

// Caso real del usuario: saldo de arranque + un gasto del día
const transacciones = [
  { id: 't1', fecha: hoy, descripcion: 'Saldo inicial Nequi', monto: 125000, tipo: 'ingreso', fuente: 'nequi', categoria: 'otros' },
  { id: 't2', fecha: hoy, descripcion: 'Saldo inicial Bancolombia', monto: 2000, tipo: 'ingreso', fuente: 'bancolombia', categoria: 'otros' },
  { id: 't3', fecha: hoy, descripcion: 'almuerzo', monto: 15000, tipo: 'gasto', fuente: 'nequi', categoria: 'comida' },
  { id: 't4', fecha: `${mes}-02`, descripcion: 'uber', monto: 8000, tipo: 'gasto', fuente: 'nequi', categoria: 'transporte' }
];
const deudas = [{ id: 'd1', direccion: 'debo', monto: 20000, pagada: false, persona: 'Andre' }];

const r = calcularFinanciamiento([], deudas, [], hoy, transacciones);
check('Nequi (125000 - 15000 - 8000)', r.porFuente.nequi, 102000);
check('Bancolombia', r.porFuente.bancolombia, 2000);
check('Efectivo', r.porFuente.efectivo, 0);
check('En bolsillo', r.efectivo, 104000);
check('Debes', r.debes, 20000);
check('Patrimonio (bolsillo - debes)', r.patrimonio, 84000);

// Los movimientos viejos y las transacciones nuevas suman al MISMO bolsillo
const conAmbos = calcularFinanciamiento(
  [{ id: 'm1', tipo: 'entrada', monto: 50000, fuente: 'efectivo', fecha: hoy }],
  [], [], hoy, transacciones);
check('las dos tablas suman al mismo bolsillo', conAmbos.efectivo, 154000);

// La vista se renderiza y muestra los mismos numeros
const state = {
  movimientosFinanciamiento: [], transacciones, deudas,
  cuentasCobro: [], pagosMensuales: [], finanzasVista: 'dia'
};
const html = renderFinanciamiento(state);
check('el patrimonio sale en pantalla', html.includes('$84.000'), true);
check('saldo de Nequi en pantalla', html.includes('$102.000'), true);
check('sin NaN', /NaN/.test(html), false);
check('sin undefined', /undefined/.test(html), false);
// El saldo ya no se inventa: no debe quedar ningun 127000/saldoInicial escrito a mano.
const fs = await import('node:fs');
const fuentes = ['../src/views/financiamiento.js', '../src/lib/financiamiento.js']
  .map(f => fs.readFileSync(f, 'utf8')).join('');
check('sin saldo inicial escrito a mano', /127000|saldoInicial/.test(fuentes), false);
// Con cero movimientos el saldo es 0, no un numero inventado
const vacio = calcularFinanciamiento([], [], [], hoy, []);
check('sin datos el bolsillo es 0', vacio.efectivo, 0);
check('sin datos el patrimonio es 0', vacio.patrimonio, 0);
check('sin datos avisa como arrancar', renderFinanciamiento({ movimientosFinanciamiento: [], transacciones: [], deudas: [], cuentasCobro: [], pagosMensuales: [], finanzasVista: 'dia' }).includes('Todavía no hay nada registrado'), true);
check('trae el formulario de registro', html.includes('data-act="transaccion-agregar"'), true);
check('agrupa gastos por categoria', html.includes('comida') && html.includes('transporte'), true);

// Las otras pestañas tambien renderizan
for (const v of ['ingresos', 'gastos', 'deudas']) {
  const h = renderFinanciamiento({ ...state, finanzasVista: v });
  check(`pestaña ${v} renderiza`, h.length > 500 && !/NaN|undefined/.test(h), true);
}

console.log(fallos === 0 ? '\n✅ TODO CUADRA' : `\n❌ ${fallos} FALLAN`);
process.exit(fallos ? 1 : 0);
