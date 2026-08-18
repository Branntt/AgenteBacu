import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';
import { UNIVERSIDAD } from '../data/universidad.js';

function fmtFecha(f) {
  if (!f) return '';
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

function cursoFilaHtml(c) {
  const icono = c.estado === 'ok' ? '<span style="color:var(--verde);">✓</span>'
    : c.estado === 'parcial' ? '<span style="color:#EFC94C;">◐</span>'
    : '<span style="color:var(--rojo);">○</span>';
  const cred = c.creditos != null ? `${c.aprob != null ? c.aprob + '/' : ''}${c.creditos} cr` : '';
  return `
    <div class="uni-curso ${c.estado}">
      <span class="uni-curso-ic">${icono}</span>
      <div class="uni-curso-cuerpo">
        <div class="uni-curso-nombre">${escapeHtml(c.curso)}</div>
        ${c.materia ? `<div class="uni-curso-materia">${escapeHtml(c.materia)}</div>` : ''}
      </div>
      ${c.nota ? `<span class="uni-curso-nota">${escapeHtml(c.nota)}</span>` : ''}
      ${cred ? `<span class="uni-curso-cred">${cred}</span>` : ''}
    </div>
  `;
}

function bloqueHtml(b, idx, abierto) {
  const pct = b.req > 0 ? Math.round((b.aprob / b.req) * 100) : (b.estado === 'ok' ? 100 : 0);
  const color = b.estado === 'ok' ? 'var(--verde)' : '#EFC94C';
  const tieneCursos = b.cursos && b.cursos.length;
  return `
    <div class="uni-bloque ${b.estado}">
      <div class="uni-bloque-head" ${tieneCursos ? `data-act="uni-toggle" data-idx="${idx}"` : ''}>
        <span class="uni-bloque-nombre">${b.estado === 'ok' ? '👍' : '✋'} ${escapeHtml(b.nombre)}</span>
        <span class="uni-bloque-cred">${b.aprob}/${b.req} cr</span>
        <div class="uni-bloque-barra"><div class="uni-bloque-fill" style="width:${pct}%;background:${color};"></div></div>
        ${tieneCursos ? `<span class="uni-bloque-toggle">${abierto ? '−' : '+'}</span>` : '<span class="uni-bloque-toggle"></span>'}
      </div>
      ${tieneCursos && abierto ? `<div class="uni-bloque-cursos">${b.cursos.map(cursoFilaHtml).join('')}</div>` : ''}
    </div>
  `;
}


// Pendientes de clase: tareas con columna 'Universidad' (ver pendienteUniNuevo en el store).
// Se agrupan por materia/profesor, y las ya hechas quedan abajo tachadas en vez de
// desaparecer — sirve para ver qué se entregó esta semana.
function pendientesUniHtml(state) {
  const hoy = hoyStr();
  const pendientes = (state.tareas || []).filter(t => t.columna === 'Universidad');
  const porHacer = pendientes.filter(t => !t.hecha);
  const hechas = pendientes.filter(t => t.hecha);

  const grupos = {};
  for (const t of porHacer) {
    const clave = (t.materia || '').trim() || 'Sin materia';
    (grupos[clave] = grupos[clave] || []).push(t);
  }
  // Dentro de cada materia, lo que se entrega antes va primero; lo que no tiene fecha, al final.
  for (const k of Object.keys(grupos)) {
    grupos[k].sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));
  }

  const filaHtml = (t, tachado) => {
    const vencida = !tachado && t.fecha && t.fecha < hoy;
    const esHoy = !tachado && t.fecha === hoy;
    const etiquetaFecha = t.fecha
      ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;white-space:nowrap;color:${vencida ? 'var(--rojo)' : esHoy ? '#EFC94C' : 'var(--muted)'};">${vencida ? '⏰ ' : esHoy ? '📌 hoy · ' : ''}${fmtFecha(t.fecha)}</span>`
      : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);">
        <button data-act="tarea-toggle" data-id="${escapeHtml(t.id)}" title="${tachado ? 'Marcar como pendiente' : 'Marcar como hecha'}"
          style="flex:none;width:20px;height:20px;border-radius:50%;cursor:pointer;background:${tachado ? 'var(--verde)' : 'transparent'};border:2px solid ${tachado ? 'var(--verde)' : 'var(--line)'};color:#fff;font-size:11px;line-height:1;padding:0;">${tachado ? '✓' : ''}</button>
        <div style="flex:1;min-width:0;font-size:13px;overflow-wrap:break-word;${tachado ? 'opacity:0.45;text-decoration:line-through;' : ''}">${escapeHtml(t.texto || 'Sin descripción')}</div>
        ${etiquetaFecha}
        <button data-act="tarea-eliminar" data-id="${escapeHtml(t.id)}" title="Quitar"
          style="flex:none;font-size:11px;padding:4px 9px;border-radius:6px;border:1px solid var(--line);background:var(--panel);cursor:pointer;color:var(--muted);">✕</button>
      </div>
    `;
  };

  const gruposHtml = Object.keys(grupos).sort().map(materia => `
    <div style="margin-bottom:18px;">
      <div class="mono-label" style="margin-bottom:4px;">${escapeHtml(materia)} · ${grupos[materia].length}</div>
      <div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--amarillo);border-radius:8px;padding:2px 14px;">
        ${grupos[materia].map(t => filaHtml(t, false)).join('')}
      </div>
    </div>
  `).join('');

  const vencidas = porHacer.filter(t => t.fecha && t.fecha < hoy).length;

  return `
    <div class="section-title">📌 Pendientes de clase${porHacer.length ? ` — ${porHacer.length}` : ''}</div>
    <div class="vista-sub">Lo que tenés que entregar, por materia o profesor.${vencidas ? ` <b style="color:var(--rojo);">${vencidas} ya se pasó de fecha.</b>` : ''}</div>

    <div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--verde);border-radius:8px;padding:16px;margin-bottom:18px;">
      <div class="mono-label" style="margin-bottom:10px;">➕ Nuevo pendiente</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;">
        <input type="text" id="uni-pend-materia" placeholder="Materia o profesor" value="${escapeHtml(state.uniPendMateria || '')}" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;width:100%;min-width:0;color-scheme:dark;">
        <input type="text" id="uni-pend-texto" placeholder="Qué hay que hacer" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;width:100%;min-width:0;color-scheme:dark;">
        <input type="date" id="uni-pend-fecha" title="Fecha de entrega (opcional)" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;width:100%;min-width:0;color-scheme:dark;">
      </div>
      <button class="btn-primary" data-act="pendiente-uni-nuevo" style="width:100%;margin-top:10px;">Agregar pendiente</button>
    </div>

    ${porHacer.length ? gruposHtml : '<div class="empty-note">Nada pendiente por ahora 🎉</div>'}

    ${hechas.length ? `
      <div class="mono-label" style="margin:18px 0 4px;opacity:0.6;">Ya hechas · ${hechas.length}</div>
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:2px 14px;">
        ${hechas.slice(-8).map(t => filaHtml(t, true)).join('')}
      </div>
    ` : ''}
  `;
}

export function renderUniversidad(state) {
  const U = UNIVERSIDAD;
  const pct = ((U.creditosAprobados / U.creditosRequeridos) * 100);
  const pctTxt = pct.toFixed(2);
  const faltan = U.creditosRequeridos - U.creditosAprobados;
  const abiertos = state.uniBloquesAbiertos || {};

  // Ruta de salida: usar cursosPendientes (lista oficial de lo que falta)
  const pendientes = [];
  if (U.cursosPendientes) {
    U.cursosPendientes.forEach(c => {
      pendientes.push({ bloque: `${c.sem} semestre`, ...c });
    });
  }

  const rutaHtml = pendientes.map(c => `
    <div class="uni-ruta-item">
      <span class="uni-ruta-check">○</span>
      <div class="uni-ruta-cuerpo">
        <div class="uni-ruta-nombre">${escapeHtml(c.curso)}</div>
        <div class="uni-ruta-bloque">${escapeHtml(c.bloque)}${c.creditos != null ? ` · ${c.creditos} cr` : ''}</div>
      </div>
    </div>
  `).join('');

  const bloquesHtml = U.bloques.map((b, i) => bloqueHtml(b, i, !!abiertos[i])).join('');

  const M = U.matriculaActual || U.matriculaRecomendada;
  const matriculaHtml = M && M.cursos ? M.cursos.map(c => `
    <div class="uni-mat-fila">
      <div>
        <div class="uni-mat-curso">${escapeHtml(c.curso)}</div>
        <div class="uni-mat-meta">Sem ${c.sem}${c.nrc ? ` · NRC ${escapeHtml(c.nrc)}` : ''}</div>
      </div>
      <span class="uni-mat-cred">${c.creditos} cr</span>
    </div>
  `).join('') : '';

  return `
    <main class="universidad">
      <h2 class="serif" style="margin:0 0 6px;font-size:32px;">Universidad</h2>
      <div class="vista-sub">${escapeHtml(U.programa)} · ${escapeHtml(U.id)} — evaluado ${fmtFecha(U.evaluado)}</div>

      <!-- AVANCE GLOBAL -->
      <div class="uni-avance">
        <div class="uni-avance-top">
          <div>
            <div class="mono-label">Avance de carrera</div>
            <div class="uni-avance-valor">${pctTxt}%</div>
          </div>
          <div class="uni-avance-cred">
            <div><span class="uni-num verde">${U.creditosAprobados}</span> aprobados</div>
            <div><span class="uni-num">${U.creditosRequeridos}</span> requeridos</div>
            <div><span class="uni-num rojo">${faltan}</span> te faltan</div>
          </div>
        </div>
        <div class="uni-avance-barra"><div class="uni-avance-fill" style="width:${pct}%;"></div></div>
      </div>

      <!-- PENDIENTES DE CLASE -->
      ${pendientesUniHtml(state)}

      <!-- RUTA DE SALIDA -->
      <div class="section-title">🎓 Tu ruta para graduarte — ${pendientes.length} pendientes</div>
      <div class="vista-sub">Todo lo que falta para cumplir y salir, en una sola lista.</div>
      <div class="uni-ruta">${rutaHtml}</div>

      <!-- PRÓXIMO SEMESTRE -->
      ${M ? `<div class="section-title">📋 Matrícula actual · ${escapeHtml(M.periodo)}</div>
      <div class="vista-sub">${M.creditosMatriculados || '?'} créditos matriculados.</div>
      <div class="uni-matricula">${matriculaHtml}</div>` : ''}

      <!-- CUMPLIMIENTO POR BLOQUE -->
      <div class="section-title">Cumplimiento por bloque</div>
      <div class="vista-sub">Toca un bloque con cursos para ver el detalle.</div>
      <div class="uni-bloques">${bloquesHtml}</div>
    </main>
  `;
}
