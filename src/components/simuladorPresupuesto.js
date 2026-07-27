import { escapeHtml } from '../lib/format.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function rubloHtml(label, valor, monto, cambiar) {
  return `
    <div class="rubro-presupuesto">
      <div class="rubro-label">${label}</div>
      <div class="rubro-input">
        <input type="number" data-change="${cambiar}" value="${monto || 0}" inputmode="numeric" placeholder="0">
      </div>
      <div class="rubro-valor">${fmtMoney(monto)}</div>
    </div>
  `;
}

export function renderSimuladorPresupuesto(presupuesto) {
  const p = presupuesto || {
    arriendo: 700000,
    servicios: 200000,
    comida: 450000,
    transporte: 120000,
    personales: 100000,
    entretenimiento: 80000,
    telefono: 50000,
    salud: 100000,
    ahorro: 200000,
    ingresosMensuales: 0
  };

  const totalGastos =
    (Number(p.arriendo) || 0) +
    (Number(p.servicios) || 0) +
    (Number(p.comida) || 0) +
    (Number(p.transporte) || 0) +
    (Number(p.personales) || 0) +
    (Number(p.entretenimiento) || 0) +
    (Number(p.telefono) || 0) +
    (Number(p.salud) || 0) +
    (Number(p.ahorro) || 0);

  const ingresos = Number(p.ingresosMensuales) || 0;
  const balance = ingresos - totalGastos;
  const puedeVivirSolo = balance >= 0;

  return `
    <div class="simulador-presupuesto">
      <div class="simulador-title">📊 Simulador: ¿Puedo vivir solo?</div>
      <div class="simulador-sub">Presupuesto de adulto solo en Bucaramanga. Ajusta los valores según tu realidad.</div>

      <div class="simulador-section">
        <div class="simulador-section-title">Ingresos mensuales</div>
        <div class="ingreso-grande">
          <input type="number" data-change="presupuesto-ingresos" value="${ingresos || 0}" inputmode="numeric" placeholder="¿Cuánto ganas al mes?">
          <div class="ingreso-valor">${fmtMoney(ingresos)}</div>
        </div>
      </div>

      <div class="simulador-section">
        <div class="simulador-section-title">Gastos mensuales</div>
        ${rubloHtml('🏠 Arriendo', 'arriendo', p.arriendo, 'presupuesto-arriendo')}
        ${rubloHtml('💡 Servicios (agua, luz, gas, internet)', 'servicios', p.servicios, 'presupuesto-servicios')}
        ${rubloHtml('🍽️ Comida', 'comida', p.comida, 'presupuesto-comida')}
        ${rubloHtml('🚌 Transporte', 'transporte', p.transporte, 'presupuesto-transporte')}
        ${rubloHtml('🧴 Personales (higiene, ropa)', 'personales', p.personales, 'presupuesto-personales')}
        ${rubloHtml('🎬 Entretenimiento', 'entretenimiento', p.entretenimiento, 'presupuesto-entretenimiento')}
        ${rubloHtml('📱 Teléfono', 'telefono', p.telefono, 'presupuesto-telefono')}
        ${rubloHtml('🏥 Salud/imprevistos', 'salud', p.salud, 'presupuesto-salud')}
        ${rubloHtml('💰 Ahorro', 'ahorro', p.ahorro, 'presupuesto-ahorro')}
      </div>

      <div class="simulador-total">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div class="mono-label">Total gastos</div>
            <div class="total-valor" style="font-size:28px;color:var(--rojo);">${fmtMoney(totalGastos)}</div>
          </div>
          <div>
            <div class="mono-label">Balance mensual</div>
            <div class="total-valor" style="font-size:28px;color:${balance >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(balance)}</div>
          </div>
        </div>
      </div>

      <div class="simulador-resultado ${puedeVivirSolo ? 'positivo' : 'negativo'}">
        ${puedeVivirSolo ? `
          <div class="resultado-titulo">✓ Puedes vivir solo</div>
          <div class="resultado-texto">Te sobra ${fmtMoney(balance)} al mes para emergencias o más ahorros.</div>
        ` : `
          <div class="resultado-titulo">✗ Aún no puedes vivir solo</div>
          <div class="resultado-texto">Te faltan ${fmtMoney(Math.abs(balance))} al mes. Necesitas ganar más o reducir gastos.</div>
        `}
      </div>

      <div class="simulador-tips">
        <div class="simulador-section-title">💡 Recomendaciones</div>
        ${ingresos === 0 ? `
          <div class="tip">Ingresa tu ingreso mensual para ver si te alcanza.</div>
        ` : puedeVivirSolo ? `
          <div class="tip">✓ Tu presupuesto está equilibrado. Considera aumentar ahorro.</div>
        ` : `
          <div class="tip">Opciones: 1) Aumentar ingresos en ${fmtMoney(Math.abs(balance))}, 2) Reducir gastos, 3) Compartir arriendo.</div>
        `}
      </div>
    </div>
  `;
}
