// Pruebas de humo, sin dependencias: `node tests/<archivo>` desde la carpeta tests/.
// Existen porque una variable renombrada dejó tres referencias muertas en bienestar.js,
// Bienestar dejó de abrir en producción y nadie se enteró hasta que el usuario lo reportó.
// La regla que imponen: toda función exportada corre sin lanzar, y la pantalla se arma.
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
  key: i => Array.from(mem.keys())[i] ?? null,
  get length() { return mem.size; }
};

const B = await import('../src/lib/bienestar.js');
const { renderBienestar } = await import('../src/views/bienestar.js');
const { hoyStr, lunesDe } = await import('../src/lib/idea.js');

const hoy = hoyStr();
let fallos = 0;
const ok = (n, cond, extra = '') => { if (!cond) fallos++; console.log(`${cond ? '✅' : '❌'} ${n}${cond ? '' : ' ' + extra}`); };
const noLanza = (n, fn) => { try { const r = fn(); ok(n, true); return r; } catch (e) { fallos++; console.log(`❌ ${n} -> ${e.constructor.name}: ${e.message}`); return null; } };

const habitos = [
  { id: 'h1', categoria: 'habito', titulo: 'no smoking', bloque: 'manana', fecha: hoy },
  { id: 'h2', categoria: 'habito', titulo: 'Ir al gym / ejercicio', bloque: 'dia', fecha: null },
  { id: 'h3', categoria: 'habito', titulo: 'Dormir 7–9 horas', bloque: 'noche', fecha: null }
];
B.logHabitToggle('h1', true, hoy);

const state = {
  ideas: [{ id: 'i1', titulo: 'Reel', estado: 'edicion', prioridad: 'Alta', fecha: null, fechaRodaje: null, objetivos: [] }],
  clientes: [{ id: 'c1', nombre: 'Cliente', estado: 'por_pagar', precio: 500000 }],
  deudas: [{ id: 'd1', direccion: 'debo', monto: 20000, pagada: false, persona: 'Andre' }],
  cuentasCobro: [], tareas: [{ id: 't1', hecha: false, fecha: hoy, texto: 'algo' }],
  metasPersonales: habitos, metasMensuales: [], transacciones: [], movimientosFinanciamiento: [],
  diaSeleccionadoBienestar: hoy, semanaSeleccionadaBienestar: lunesDe(hoy)
};

// Toda funcion exportada debe correr sin lanzar — esto es justo lo que fallo:
// una variable renombrada dejo tres referencias muertas y la pantalla no abria.
noLanza('clasificarIdea', () => B.clasificarIdea(state.ideas[0], hoy));
const estres = noLanza('calcularEstres', () => B.calcularEstres(state));
noLanza('getGreeting', () => B.getGreeting());
noLanza('getHabitStreak', () => B.getHabitStreak('h1'));
noLanza('getStreakBadge', () => B.getStreakBadge(3));
const qc = noLanza('calcularQuickCheck', () => B.calcularQuickCheck(habitos, hoy));
const stats = noLanza('calcularStatsGamificacion', () => B.calcularStatsGamificacion(habitos, hoy));
noLanza('isHabitMarkedOnDate', () => B.isHabitMarkedOnDate('h1', hoy));
noLanza('syncHabitLogToday', () => B.syncHabitLogToday(habitos, hoy));
noLanza('calcularAnalisisSemanal', () => B.calcularAnalisisSemanal(habitos, hoy));
noLanza('calcularAnalisisMensual', () => B.calcularAnalisisMensual(habitos, hoy));
noLanza('ordenarHabitos', () => B.ordenarHabitos(habitos));
noLanza('getBloqueHabito', () => B.getBloqueHabito(habitos[0]));

// La pantalla completa, que es lo que el usuario ve
const html = noLanza('renderBienestar (la pantalla abre)', () => renderBienestar(state));
if (html) {
  ok('la pantalla trae contenido', html.length > 1000, `(${html?.length} chars)`);
  ok('sin undefined en pantalla', !/undefined/.test(html));
  ok('sin NaN en pantalla', !/NaN/.test(html));
  ok('muestra los habitos', html.includes('no smoking'));
}

// Los numeros del dia salen del registro, no del campo viejo
ok('cuenta 1 habito hecho hoy', qc?.hechos === 1, `(dio ${qc?.hechos})`);
ok('estres cuenta el alivio del habito', estres?.habitosHoy === 1, `(dio ${estres?.habitosHoy})`);
ok('gamificacion cuenta el objetivo logrado', stats?.objetivosLogrados === 1, `(dio ${stats?.objetivosLogrados})`);

// Y con la app vacia tampoco puede reventar
noLanza('pantalla vacia no revienta', () => renderBienestar({
  ideas: [], clientes: [], deudas: [], cuentasCobro: [], tareas: [],
  metasPersonales: [], metasMensuales: [], transacciones: [], movimientosFinanciamiento: [],
  diaSeleccionadoBienestar: hoy, semanaSeleccionadaBienestar: lunesDe(hoy)
}));

// El registro guardado puede estar ilegible (storage a medio escribir, otra versión de la
// app, alguien tocándolo a mano). Nada de eso puede tumbar la pantalla: un registro que no
// sea un objeto se trata como vacío. `null` en particular tumbaba Bienestar entero.
for (const [nombre, valor] of Object.entries({
  'registro null': 'null', 'registro lista': '[1,2]', 'registro texto': '"hola"',
  'registro roto': '{no es json', 'registro con dia null': `{"${hoy}":null}`,
  'registro con dia que no es lista': `{"${hoy}":42}`
})) {
  mem.set('bacu.habitos.log', valor);
  noLanza(`${nombre} no tumba la pantalla`, () => renderBienestar(state));
}
mem.delete('bacu.habitos.log');

console.log(fallos === 0 ? '\n✅ BIENESTAR ABRE Y TODO CUADRA' : `\n❌ ${fallos} FALLAN`);
process.exit(fallos ? 1 : 0);

