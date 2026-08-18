import { escapeHtml, fmtNum } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';
import { calcularFinanciamiento } from '../lib/financiamiento.js';
import { UNIVERSIDAD } from '../data/universidad.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-CO');
}

function renderContenidoPipeline(ideas) {
  const activas = ideas.filter(i => i.estado !== 'descartada');
  const sinGuion = activas.filter(i => !i.guion || i.guion.trim() === '').length;
  const conGuion = activas.filter(i => i.guion && i.guion.trim() !== '').length;
  const grabados = activas.filter(i => ['grabar', 'produccion', 'edicion', 'entrega', 'por_pagar', 'ya_pago', 'publicada'].includes(i.estado)).length;

  return `
    <div class="panorama-seccion">
      <div class="seccion-titulo">📹 Contenido en Pipeline</div>
      <div class="pipeline-numeros">
        <div class="pipeline-item">
          <div class="pipeline-numero">${sinGuion}</div>
          <div class="pipeline-label">Ideas sin guion</div>
        </div>
        <div class="pipeline-item">
          <div class="pipeline-numero">${conGuion}</div>
          <div class="pipeline-label">Guiones</div>
        </div>
        <div class="pipeline-item">
          <div class="pipeline-numero">${grabados}</div>
          <div class="pipeline-label">Rodajes grabados</div>
        </div>
      </div>
    </div>
  `;
}

function renderEstadoEquipos(equipoProd, metasPersonales) {
  const conEnergia = [
    ...(equipoProd || []).filter(e => e.requiere_energia),
    ...(metasPersonales || []).filter(m => (m.categoria || '').startsWith('inv_') && m.requiere_energia)
  ].slice(0, 5);

  if (!conEnergia.length) {
    return `
      <div class="panorama-seccion">
        <div class="seccion-titulo">🎥 Estado de Equipos</div>
        <div class="empty-note">Sin equipos que requieran carga registrados.</div>
      </div>
    `;
  }

  const itemsHtml = conEnergia.map(e => {
    const nombre = e.nombre || 'Sin nombre';
    const pct = Number(e.carga_porcentaje) || 0;
    const estado = e.estado_carga || 'desconocido';
    const colorBarra = pct >= 70 ? '#4CAF50' : pct >= 30 ? '#FFC107' : '#F44336';
    const alerta = pct < 30 || ['descargado', 'sin_bateria', 'requiere_pilas'].includes(estado);

    return `
      <div class="equipo-item">
        <div class="equipo-info">
          <span class="equipo-nombre">${escapeHtml(nombre)}</span>
          <span class="equipo-estado ${alerta ? 'alerta' : ''}">${pct}% ${alerta ? '⚠️' : '✓'}</span>
        </div>
        <div class="equipo-barra">
          <div class="equipo-fill" style="width:${pct}%;background:${colorBarra};"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="panorama-seccion">
      <div class="seccion-titulo">🎥 Estado de Equipos</div>
      <div class="equipos-lista">${itemsHtml}</div>
    </div>
  `;
}

function renderTop3Tareas(tareas) {
  const urgentes = tareas
    .filter(t => !t.hecha)
    .sort((a, b) => {
      const orden = { 'Urgente': 0, 'Hoy': 1, 'Semana': 2, 'Guiones': 3, 'IA': 4, 'METAS': 5, 'Mejoras': 6, 'Sin fecha': 7 };
      const ordenA = orden[a.columna] ?? 999;
      const ordenB = orden[b.columna] ?? 999;
      return ordenA - ordenB;
    })
    .slice(0, 3);

  if (!urgentes.length) {
    return `
      <div class="panorama-seccion">
        <div class="seccion-titulo">⚡ Hoy — Prioritario</div>
        <div class="empty-note">¡Todo despejado! 🎉</div>
      </div>
    `;
  }

  const itemsHtml = urgentes.map((t, idx) => {
    const colores = { 'Urgente': '#FF4444', 'Hoy': '#2196F3', 'Semana': '#4CAF50', 'Guiones': '#9C27B0', 'IA': '#FF9800' };
    const color = colores[t.columna] || '#757575';
    return `
      <div class="tarea-item">
        <span class="tarea-numero">${idx + 1}</span>
        <span class="tarea-color" style="background:${color}"></span>
        <span class="tarea-texto">${escapeHtml(t.texto.substring(0, 50))}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="panorama-seccion">
      <div class="seccion-titulo">⚡ Hoy — Prioritario</div>
      <div class="tareas-list">${itemsHtml}</div>
    </div>
  `;
}

function renderUniversidad() {
  const creditosFaltantes = UNIVERSIDAD.creditosRequeridos - UNIVERSIDAD.creditosAprobados;
  const pct = (UNIVERSIDAD.creditosAprobados / UNIVERSIDAD.creditosRequeridos) * 100;

  const cursosHtml = UNIVERSIDAD.cursosPendientes.map(c => `
    <div class="uni-curso">
      <span>${escapeHtml(c.curso)}</span>
      <span class="uni-creditos">${c.creditos} cr</span>
    </div>
  `).join('');

  return `
    <div class="panorama-seccion">
      <div class="seccion-titulo">📚 Universidad</div>
      <div class="uni-progreso">
        <div class="uni-bar">
          <div class="uni-fill" style="width:${pct}%"></div>
        </div>
        <div class="uni-stats">
          <span>${UNIVERSIDAD.creditosAprobados} / ${UNIVERSIDAD.creditosRequeridos} créditos</span>
          <span class="uni-faltantes">Faltán ${creditosFaltantes} cr</span>
        </div>
      </div>
      <div class="uni-cursos">
        <div class="uni-label">Pendientes:</div>
        ${cursosHtml}
      </div>
      <button class="btn-primary btn-small" data-act="nav-go" data-view="universidad" style="width:100%;margin-top:12px;">
        Registrar trabajo asignado
      </button>
    </div>
  `;
}

function renderMetasProgreso(metasPersonales) {
  const metas = (metasPersonales || [])
    .filter(m => !(m.categoria || '').startsWith('inv_') && m.categoria !== 'habito' && !m.cumplida)
    .slice(0, 4);

  if (!metas.length) {
    return `
      <div class="panorama-seccion">
        <div class="seccion-titulo">🎯 Metas Activas</div>
        <div class="empty-note">¡Todas las metas completadas! 🏆</div>
      </div>
    `;
  }

  const metasHtml = metas.map(m => {
    const pasos = (m.pasos || []);
    const pasosHechos = pasos.filter(p => p.hecho).length;
    const pct = pasos.length > 0 ? (pasosHechos / pasos.length) * 100 : 0;

    return `
      <div class="meta-item">
        <div class="meta-nombre">${escapeHtml(m.nombre.substring(0, 45))}</div>
        ${pasos.length > 0 ? `
          <div class="meta-bar">
            <div class="meta-fill" style="width:${pct}%"></div>
          </div>
          <div class="meta-stat">${pasosHechos} / ${pasos.length} pasos</div>
        ` : '<div class="meta-stat" style="color:var(--muted);">Sin pasos</div>'}
      </div>
    `;
  }).join('');

  return `
    <div class="panorama-seccion">
      <div class="seccion-titulo">🎯 Metas Activas</div>
      <div class="metas-lista">${metasHtml}</div>
    </div>
  `;
}

export function renderPanorama(state) {
  const hoy = hoyStr();
  const finTotal = calcularFinanciamiento(state.movimientosFinanciamiento, state.deudas, state.cuentasCobro, hoy, state.transacciones);

  return `
    <main class="panorama-nuevo">
      <h2 class="serif" style="margin:0;font-size:32px;margin-bottom:4px;">Panorama</h2>
      <div class="vista-sub">Centro de datos visual — todo de un vistazo.</div>

      <div class="panorama-grid">
        ${renderContenidoPipeline(state.ideas || [])}
        ${renderEstadoEquipos(state.equipoProduccion || [], state.metasPersonales || [])}
        ${renderTop3Tareas(state.tareas || [])}
        ${renderUniversidad()}
        ${renderMetasProgreso(state.metasPersonales || [])}

        <div class="panorama-seccion">
          <div class="seccion-titulo">💰 Patrimonio Neto</div>
          <div class="patrimonio-valor ${finTotal.patrimonio < 0 ? 'negativo' : 'positivo'}">
            ${fmtMoney(finTotal.patrimonio)}
          </div>
          <div class="patrimonio-desglose">
            <div class="desglose-item">
              <span>En bolsillo:</span>
              <span class="verde">${fmtMoney(finTotal.efectivo)}</span>
            </div>
            <div class="desglose-item">
              <span>Te deben:</span>
              <span class="azul">${fmtMoney(finTotal.teDeben)}</span>
            </div>
            <div class="desglose-item">
              <span>Debes:</span>
              <span class="rojo">${fmtMoney(finTotal.debes)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}
