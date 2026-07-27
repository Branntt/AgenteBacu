import { escapeHtml } from '../lib/format.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function gastoCardHtml(g) {
  return `
    <div class="gasto-card">
      <div class="gasto-nombre">
        <span class="gasto-emoji">${g.emoji}</span>
        <span>${escapeHtml(g.nombre)}</span>
      </div>
      <div class="gasto-info">
        <div class="gasto-monto">${fmtMoney(g.monto)}</div>
        <div class="gasto-vencimiento">Día ${g.dia_vencimiento}</div>
      </div>
      <button class="btn-text-muted" data-act="gasto-eliminar" data-id="${escapeHtml(g.id)}">✕</button>
    </div>
  `;
}

export function renderVivirSoloSimulador(gastos, efectivo) {
  const g = gastos || [];
  const totalMensual = g.reduce((sum, x) => sum + (Number(x.monto) || 0), 0);
  const mesInicial = 7; // febrero
  const mesesParaVivirSolo = totalMensual > 0 ? Math.ceil(totalMensual / 100000) : 999; // si ahorras 100k/mes
  const fechaVivirSolo = new Date(2026, mesInicial + mesesParaVivirSolo, 1);

  const gastosOrdenados = g.slice().sort((a, b) => (a.dia_vencimiento || 99) - (b.dia_vencimiento || 99));
  const gastosHtml = gastosOrdenados.length
    ? gastosOrdenados.map(gastoCardHtml).join('')
    : '<div class="empty-state">Sin gastos registrados</div>';

  return `
    <div class="vivir-solo-simulador">
      <div class="simulador-titulo">🏠 Si vivieras solo</div>
      <div class="simulador-subtitulo">Gastos mensuales que tendrías en Bucaramanga</div>

      <div class="gastos-grid">
        ${gastosHtml}
        <div class="gasto-card-add">
          <button class="btn-ghost" data-act="gasto-nuevo" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
            + Agregar gasto
          </button>
        </div>
      </div>

      <div class="simulador-totales">
        <div class="total-item">
          <div class="total-label">Total gastos al mes</div>
          <div class="total-valor" style="font-size:32px;color:var(--rojo);">${fmtMoney(totalMensual)}</div>
        </div>
        <div class="total-item">
          <div class="total-label">Tienes ahora</div>
          <div class="total-valor" style="font-size:32px;color:var(--azul);">${fmtMoney(efectivo)}</div>
        </div>
        <div class="total-item">
          <div class="total-label">Puedes vivir solo en</div>
          <div class="total-valor" style="font-size:32px;color:var(--verde);">${mesesParaVivirSolo} meses</div>
          <div class="total-fecha">${fechaVivirSolo.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="calendario-pagos">
        <div class="calendario-titulo">📅 Calendario de pagos</div>
        <div class="calendario-items">
          ${[1,2,3,4].map(semana => {
            const diasInicio = (semana - 1) * 7 + 1;
            const diasFin = Math.min(semana * 7, 28);
            const gastosSemana = g.filter(x => x.dia_vencimiento >= diasInicio && x.dia_vencimiento <= diasFin);
            const totalSemana = gastosSemana.reduce((sum, x) => sum + (Number(x.monto) || 0), 0);
            return `
              <div class="calendario-semana">
                <div class="semana-titulo">Semana ${semana} (${diasInicio}-${diasFin})</div>
                ${gastosSemana.length ? `
                  <div class="semana-gastos">
                    ${gastosSemana.map(x => `<div class="semana-item">${x.emoji} ${x.nombre}</div>`).join('')}
                  </div>
                  <div class="semana-total">${fmtMoney(totalSemana)}</div>
                ` : '<div class="semana-vacia">Sin gastos esta semana</div>'}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="recomendacion">
        ${totalMensual > 0 ? `
          <div class="rec-titulo">💡 Para vivir solo necesitas:</div>
          <div class="rec-items">
            <div class="rec-item">
              <span>Ingreso mensual mínimo:</span>
              <strong>${fmtMoney(totalMensual)}</strong>
            </div>
            <div class="rec-item">
              <span>Si ganas ${fmtMoney(totalMensual + 200000)}, ahorras:</span>
              <strong>${fmtMoney(200000)}/mes</strong>
            </div>
            <div class="rec-item">
              <span>En 1 año ahorras:</span>
              <strong>${fmtMoney(2400000)}</strong>
            </div>
          </div>
        ` : '<div class="rec-titulo">Agrega gastos para ver las proyecciones</div>'}
      </div>
    </div>
  `;
}
