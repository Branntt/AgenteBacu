export function renderNotificacionBacu(state) {
  if (!state.notificacionBacu) return '';

  const esRespuesta = state.notificacionBacu === 'grabé' || state.notificacionBacu === 'procrastiné';

  if (esRespuesta) {
    const mensaje = state.notificacionBacu === 'grabé'
      ? '✅ ¡Excelente! Sigue así 🔥'
      : '⏰ Está bien, mañana es un nuevo día. ¡Tú puedes! 💪';

    return `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${state.notificacionBacu === 'grabé' ? 'var(--verde)' : 'var(--naranja)'};
        color: white;
        padding: 16px 32px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
      ">
        ${mensaje}
      </div>
      <style>
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      </style>
    `;
  }

  return `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--azul), var(--verde));
      color: white;
      padding: 20px 32px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
    ">
      <div style="margin-bottom: 14px; text-align: center; font-size: 16px;">🎬 ¿GRABÉ O PROCRASTINÉ?</div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button
          data-act="grabe-bacu"
          style="
            padding: 10px 24px;
            background: rgba(255,255,255,0.3);
            border: 2px solid white;
            color: white;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.5)';"
          onmouseout="this.style.background='rgba(255,255,255,0.3)';"
        >
          ✅ Grabé
        </button>
        <button
          data-act="procrastine-bacu"
          style="
            padding: 10px 24px;
            background: rgba(255,255,255,0.3);
            border: 2px solid white;
            color: white;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.5)';"
          onmouseout="this.style.background='rgba(255,255,255,0.3)';"
        >
          ⏰ Procrastiné
        </button>
      </div>
    </div>
    <style>
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    </style>
  `;
}
