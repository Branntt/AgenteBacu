import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';

const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATEGORIAS_GASTOS = [
  { id: 'arriendo', label: '🏠 Arriendo', color: '#E74C3C' },
  { id: 'comida', label: '🍽️ Comida & Mercado', color: '#F39C12' },
  { id: 'servicios', label: '💡 Servicios (agua, luz, etc)', color: '#3498DB' },
  { id: 'transporte', label: '🚗 Transporte', color: '#9B59B6' },
  { id: 'suscripciones', label: '📱 Suscripciones (apps, streaming)', color: '#1ABC9C' },
  { id: 'salud', label: '⚕️ Salud & Medicina', color: '#E91E63' },
  { id: 'personal', label: '✨ Personal (ropa, accesorios)', color: '#2ECC71' },
  { id: 'otro', label: '📌 Otro', color: '#95A5A6' },
];

function formatPeso(num) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function saldoCardHtml(cuenta) {
  return `
    <div class="fp-saldo-card">
      <div class="fp-saldo-label">${escapeHtml(cuenta.nombre_cuenta)}</div>
      <div class="fp-saldo-amount">${formatPeso(cuenta.monto_actual)}</div>
      <button class="fp-edit-saldo" data-act="fp-edit-saldo" data-id="${escapeHtml(cuenta.id)}" title="Editar saldo">✎</button>
    </div>
  `;
}

function gastoItemHtml(gasto, index) {
  const categoria = CATEGORIAS_GASTOS.find(c => c.id === gasto.categoria);
  const catLabel = categoria ? categoria.label.split(' ')[0] : '📌';

  const [año, mes, día] = gasto.fecha.split('-').map(Number);
  const fecha = new Date(año, mes - 1, día);
  const fechaFormato = fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    weekday: 'short'
  });

  return `
    <div class="fp-gasto-item" data-id="${escapeHtml(gasto.id)}">
      <div class="fp-gasto-icon">${catLabel}</div>
      <div class="fp-gasto-info">
        <div class="fp-gasto-cat">${escapeHtml(categoria?.label || gasto.categoria)}</div>
        <div class="fp-gasto-desc">${gasto.descripcion ? escapeHtml(gasto.descripcion) : escapeHtml(gasto.cuenta)}</div>
        <div class="fp-gasto-fecha">${fechaFormato}</div>
      </div>
      <div class="fp-gasto-monto">-${formatPeso(gasto.monto)}</div>
      <button class="fp-gasto-del" data-act="fp-eliminar-gasto" data-id="${escapeHtml(gasto.id)}" title="Eliminar">✕</button>
    </div>
  `;
}

function suscripcionItemHtml(sub) {
  return `
    <div class="fp-suscripcion-item" data-id="${escapeHtml(sub.id)}">
      <div class="fp-sub-info">
        <div class="fp-sub-nombre">${escapeHtml(sub.nombre)}</div>
        <div class="fp-sub-meta">Día ${sub.dia_pago} • ${escapeHtml(sub.categoria || 'General')}</div>
      </div>
      <div class="fp-sub-monto">${formatPeso(sub.monto)}</div>
      <button class="fp-sub-del" data-act="fp-eliminar-suscripcion" data-id="${escapeHtml(sub.id)}" title="Eliminar">✕</button>
    </div>
  `;
}

function resumenMesHtml(gastos, suscripciones) {
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const yearActual = hoy.getFullYear();

  const gastosDelMes = gastos.filter(g => {
    const [año, mes] = g.fecha.split('-').map(Number);
    return año === yearActual && mes === mesActual + 1;
  });

  const totalGastos = gastosDelMes.reduce((sum, g) => sum + parseFloat(g.monto), 0);
  const totalSuscripciones = suscripciones
    .filter(s => s.activa)
    .reduce((sum, s) => sum + parseFloat(s.monto), 0);
  const totalMes = totalGastos + totalSuscripciones;

  // Gastos por categoría
  const gastosPorCat = {};
  gastosDelMes.forEach(g => {
    const cat = g.categoria;
    if (!gastosPorCat[cat]) gastosPorCat[cat] = 0;
    gastosPorCat[cat] += parseFloat(g.monto);
  });

  const catHtml = Object.entries(gastosPorCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => {
      const categoria = CATEGORIAS_GASTOS.find(c => c.id === cat);
      const pct = totalMes > 0 ? (total / totalMes * 100).toFixed(0) : 0;
      return `
        <div class="fp-cat-breakdown">
          <div class="fp-cat-label">${categoria?.label || cat}</div>
          <div class="fp-cat-bar" style="background: ${categoria?.color || '#95A5A6'}; width: ${pct}%"></div>
          <div class="fp-cat-amount">${formatPeso(total)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="fp-resumen">
      <h3 class="fp-resumen-title">Resumen de ${MESES_NOMBRE[mesActual]}</h3>

      <div class="fp-stats-grid">
        <div class="fp-stat">
          <div class="fp-stat-label">Gastos</div>
          <div class="fp-stat-value">${formatPeso(totalGastos)}</div>
        </div>
        <div class="fp-stat">
          <div class="fp-stat-label">Suscripciones</div>
          <div class="fp-stat-value">${formatPeso(totalSuscripciones)}</div>
        </div>
        <div class="fp-stat fp-stat-total">
          <div class="fp-stat-label">Total mes</div>
          <div class="fp-stat-value">${formatPeso(totalMes)}</div>
        </div>
      </div>

      ${totalGastos > 0 ? `
        <div class="fp-breakdown">
          <h4 class="fp-breakdown-title">Desglose por categoría</h4>
          ${catHtml}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderFinanzasPersonales(state) {
  const hoy = hoyStr();
  const saldos = state.saldosPersonales || [];
  const gastos = state.gastosPersonales || [];
  const suscripciones = state.suscripcionesPersonales || [];

  const totalSaldos = saldos.reduce((sum, s) => sum + parseFloat(s.monto_actual), 0);

  // Ultimos 30 días de gastos
  const fechaLimit = new Date();
  fechaLimit.setDate(fechaLimit.getDate() - 30);
  const gastosRecientes = gastos
    .filter(g => new Date(g.fecha) >= fechaLimit)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return `
    <div class="fp-container">
      <!-- HEADER CON TOTAL -->
      <div class="fp-header">
        <h1 class="fp-title">Mi Finanzas</h1>
        <div class="fp-total-saldos">
          <div class="fp-total-label">Saldo Total</div>
          <div class="fp-total-amount">${formatPeso(totalSaldos)}</div>
        </div>
      </div>

      <!-- SALDOS POR CUENTA -->
      <div class="fp-section">
        <div class="fp-section-header">
          <h2 class="fp-section-title">📊 Saldos</h2>
          <button class="fp-btn-add" data-act="fp-nueva-cuenta" title="Nueva cuenta">+</button>
        </div>
        <div class="fp-saldos-grid">
          ${saldos.length > 0
            ? saldos.map(s => saldoCardHtml(s)).join('')
            : '<p class="fp-empty">Sin saldos registrados</p>'
          }
        </div>
      </div>

      <!-- SUSCRIPCIONES MENSUALES -->
      ${suscripciones.length > 0 ? `
        <div class="fp-section">
          <div class="fp-section-header">
            <h2 class="fp-section-title">🔄 Suscripciones Mensuales</h2>
            <button class="fp-btn-add" data-act="fp-nueva-suscripcion" title="Nueva suscripción">+</button>
          </div>
          <div class="fp-suscripciones-list">
            ${suscripciones.map(s => suscripcionItemHtml(s)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- AGREGAR GASTO -->
      <div class="fp-section">
        <div class="fp-section-header">
          <h2 class="fp-section-title">💰 Gastos Recientes</h2>
          <button class="fp-btn-add fp-btn-add-main" data-act="fp-nuevo-gasto" title="Nuevo gasto">+ GASTO</button>
        </div>

        <div class="fp-gastos-list">
          ${gastosRecientes.length > 0
            ? gastosRecientes.map((g, i) => gastoItemHtml(g, i)).join('')
            : '<p class="fp-empty">Sin gastos registrados</p>'
          }
        </div>
      </div>

      <!-- RESUMEN DEL MES -->
      ${gastos.length > 0 ? resumenMesHtml(gastos, suscripciones) : ''}

      <!-- MODALES -->
      ${modalNuevoGastoHtml()}
      ${modalNuevaSuscripcionHtml()}
      ${modalNuevaCuentaHtml()}
    </div>
  `;
}

function modalNuevoGastoHtml() {
  const hoy = hoyStr();
  const opcCategories = CATEGORIAS_GASTOS.map(c =>
    `<option value="${c.id}">${c.label}</option>`
  ).join('');

  return `
    <div class="fp-modal" id="fp-modal-gasto" data-act="fp-cerrar-modal">
      <div class="fp-modal-content" data-act-stop="true">
        <div class="fp-modal-header">
          <h2>Nuevo Gasto</h2>
          <button class="fp-modal-close" data-act="fp-cerrar-modal">✕</button>
        </div>

        <form class="fp-form" data-act="fp-guardar-gasto" data-act-stop="true">
          <div class="fp-form-group">
            <label>Fecha</label>
            <input type="date" name="fecha" value="${hoy}" required>
          </div>

          <div class="fp-form-group">
            <label>Categoría</label>
            <select name="categoria" required>
              <option value="">Selecciona...</option>
              ${opcCategories}
            </select>
          </div>

          <div class="fp-form-group">
            <label>Descripción (opcional)</label>
            <input type="text" name="descripcion" placeholder="Ej: Mercado del sábado">
          </div>

          <div class="fp-form-group">
            <label>Monto</label>
            <input type="number" name="monto" step="0.01" min="0" required placeholder="0">
          </div>

          <div class="fp-form-group">
            <label>Cuenta</label>
            <select name="cuenta" required>
              <option value="Bancolombia">Bancolombia</option>
              <option value="Nequi">Nequi</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>

          <button type="submit" class="fp-btn-submit">Guardar Gasto</button>
        </form>
      </div>
    </div>
  `;
}

function modalNuevaSuscripcionHtml() {
  return `
    <div class="fp-modal" id="fp-modal-suscripcion" data-act="fp-cerrar-modal">
      <div class="fp-modal-content" data-act-stop="true">
        <div class="fp-modal-header">
          <h2>Nueva Suscripción</h2>
          <button class="fp-modal-close" data-act="fp-cerrar-modal">✕</button>
        </div>

        <form class="fp-form" data-act="fp-guardar-suscripcion" data-act-stop="true">
          <div class="fp-form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" placeholder="Ej: Spotify, Claude, etc." required>
          </div>

          <div class="fp-form-group">
            <label>Monto Mensual</label>
            <input type="number" name="monto" step="0.01" min="0" required>
          </div>

          <div class="fp-form-group">
            <label>Día de pago</label>
            <input type="number" name="dia_pago" min="1" max="31" value="1" required>
          </div>

          <div class="fp-form-group">
            <label>Categoría (opcional)</label>
            <input type="text" name="categoria" placeholder="Ej: Apps, Streaming">
          </div>

          <button type="submit" class="fp-btn-submit">Guardar Suscripción</button>
        </form>
      </div>
    </div>
  `;
}

function modalNuevaCuentaHtml() {
  return `
    <div class="fp-modal" id="fp-modal-cuenta" data-act="fp-cerrar-modal">
      <div class="fp-modal-content" data-act-stop="true">
        <div class="fp-modal-header">
          <h2>Nueva Cuenta</h2>
          <button class="fp-modal-close" data-act="fp-cerrar-modal">✕</button>
        </div>

        <form class="fp-form" data-act="fp-guardar-cuenta" data-act-stop="true">
          <div class="fp-form-group">
            <label>Nombre de la cuenta</label>
            <input type="text" name="nombre_cuenta" placeholder="Ej: Bancolombia, Nequi" required>
          </div>

          <div class="fp-form-group">
            <label>Saldo actual</label>
            <input type="number" name="monto_actual" step="0.01" min="0" required>
          </div>

          <button type="submit" class="fp-btn-submit">Guardar Cuenta</button>
        </form>
      </div>
    </div>
  `;
}
