import { escapeHtml } from '../lib/format.js';
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

export function renderUniversidad(state) {
  const U = UNIVERSIDAD;
  const pct = ((U.creditosAprobados / U.creditosRequeridos) * 100);
  const pctTxt = pct.toFixed(2);
  const faltan = U.creditosRequeridos - U.creditosAprobados;
  const abiertos = state.uniBloquesAbiertos || {};

  // Ruta de salida: todos los cursos pendientes de todos los bloques
  const pendientes = [];
  U.bloques.forEach(b => {
    if (!b.cursos) return;
    b.cursos.forEach(c => {
      if (c.estado === 'pend' || c.estado === 'parcial') {
        pendientes.push({ bloque: b.nombre, ...c });
      }
    });
  });

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

  const M = U.matriculaRecomendada;
  const matriculaHtml = M.cursos.map(c => `
    <div class="uni-mat-fila">
      <div>
        <div class="uni-mat-curso">${escapeHtml(c.curso)}</div>
        <div class="uni-mat-meta">Sem ${c.sem} · NRC ${escapeHtml(c.nrc)}</div>
      </div>
      <span class="uni-mat-cred">${c.creditos} cr</span>
    </div>
  `).join('');

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

      <!-- RUTA DE SALIDA -->
      <div class="section-title">🎓 Tu ruta para graduarte — ${pendientes.length} pendientes</div>
      <div class="vista-sub">Todo lo que falta para cumplir y salir, en una sola lista.</div>
      <div class="uni-ruta">${rutaHtml}</div>

      <!-- PRÓXIMO SEMESTRE -->
      <div class="section-title">📋 Matrícula recomendada · ${escapeHtml(M.periodo)}</div>
      <div class="vista-sub">${M.creditosAMatricular} créditos a matricular de ${M.creditosRequeridos} requeridos.</div>
      <div class="uni-matricula">${matriculaHtml}</div>

      <!-- CUMPLIMIENTO POR BLOQUE -->
      <div class="section-title">Cumplimiento por bloque</div>
      <div class="vista-sub">Toca un bloque con cursos para ver el detalle.</div>
      <div class="uni-bloques">${bloquesHtml}</div>
    </main>
  `;
}
