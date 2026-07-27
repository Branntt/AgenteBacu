// Avatar del Inventario — personaje SVG configurable (estilo creador de personaje)

export const AVATAR_DEFAULT = {
  piel: '#C68642',
  pelo: 'corto',
  colorPelo: '#1A1A1A',
  barba: 'candado',
  ropa: '#1FAF74',
  accesorio: 'camara'
};

export const OPCIONES_AVATAR = {
  piel: { label: 'Piel', tipo: 'color', valores: ['#F7D9B8', '#E8B98A', '#C68642', '#9C5C2E', '#6B3A1C'] },
  colorPelo: { label: 'Color de pelo', tipo: 'color', valores: ['#1A1A1A', '#3B2417', '#7A4B2A', '#C79A5B', '#8E5BE8', '#E0312E'] },
  pelo: { label: 'Pelo', tipo: 'texto', valores: [['rapado', 'Rapado'], ['corto', 'Corto'], ['rizado', 'Rizado'], ['largo', 'Largo'], ['gorra', 'Gorra']] },
  barba: { label: 'Barba', tipo: 'texto', valores: [['ninguna', 'Sin barba'], ['bigote', 'Bigote'], ['candado', 'Candado'], ['completa', 'Completa']] },
  ropa: { label: 'Ropa', tipo: 'color', valores: ['#1FAF74', '#2E55E0', '#E0312E', '#E8641B', '#EFC94C', '#8E5BE8', '#181818', '#EDE7D3'] },
  accesorio: { label: 'Accesorio', tipo: 'texto', valores: [['ninguno', 'Ninguno'], ['camara', 'Cámara'], ['gafas', 'Gafas'], ['audifonos', 'Audífonos']] }
};

function oscurecer(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

function peloHtml(estilo, color) {
  if (estilo === 'rapado') {
    return `<path d="M35 52 C35 24 85 24 85 52 C85 47 84 42 82 39 C76 42 68 43 60 43 C52 43 44 42 38 39 C36 42 35 47 35 52 Z" fill="${color}" opacity=".85"/>`;
  }
  if (estilo === 'corto') {
    return `<path d="M33 60 C33 22 87 22 87 60 C87 51 86 45 84 42 C78 46 69 47 60 47 C51 47 42 46 36 42 C34 45 33 51 33 60 Z" fill="${color}"/>`;
  }
  if (estilo === 'rizado') {
    return `<g fill="${color}">
      <path d="M33 60 C33 22 87 22 87 60 C87 51 86 45 84 42 C78 46 69 47 60 47 C51 47 42 46 36 42 C34 45 33 51 33 60 Z"/>
      <circle cx="37" cy="38" r="9"/><circle cx="49" cy="28" r="10"/>
      <circle cx="63" cy="26" r="10"/><circle cx="79" cy="34" r="9.5"/>
    </g>`;
  }
  if (estilo === 'largo') {
    return `<path d="M31 54 C31 22 89 22 89 54 L89 94 L82 94 L82 56 C82 40 74 33 60 33 C46 33 38 40 38 56 L38 94 L31 94 Z" fill="${color}"/>`;
  }
  if (estilo === 'gorra') {
    const base = color === '#1A1A1A' ? '#333333' : color;
    return `<g>
      <path d="M34 46 C34 20 86 20 86 46 Z" fill="${base}"/>
      <path d="M25 46 Q60 63 95 46 Q60 39 25 46 Z" fill="${oscurecer(base, 0.72)}"/>
      <circle cx="60" cy="22" r="3" fill="${oscurecer(base, 0.72)}"/>
    </g>`;
  }
  return '';
}

function barbaHtml(tipo, color) {
  if (tipo === 'bigote') {
    return `<path d="M50 65 Q60 70 70 65 Q60 61 50 65 Z" fill="${color}"/>`;
  }
  if (tipo === 'candado') {
    return `<g fill="${color}">
      <path d="M50 65 Q60 70 70 65 Q60 61 50 65 Z"/>
      <path d="M53 75 Q60 83 67 75 Q60 71 53 75 Z"/>
    </g>`;
  }
  if (tipo === 'completa') {
    return `<g clip-path="url(#avatar-cara)" fill="${color}">
      <path d="M28 64 Q60 56 92 64 L92 96 L28 96 Z"/>
    </g>
    <path d="M52 72 Q60 77 68 72" stroke="${oscurecer(color, 0.5)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return '';
}

function accesorioHtml(tipo, piel) {
  if (tipo === 'gafas') {
    return `<g fill="none" stroke="#111" stroke-width="2.5">
      <rect x="40" y="44" width="18" height="14" rx="5" fill="rgba(255,255,255,0.12)"/>
      <rect x="62" y="44" width="18" height="14" rx="5" fill="rgba(255,255,255,0.12)"/>
      <path d="M58 51 L62 51"/><path d="M40 49 L34 47"/><path d="M80 49 L86 47"/>
    </g>`;
  }
  if (tipo === 'audifonos') {
    return `<g fill="#181818">
      <path d="M32 50 C32 20 88 20 88 50" stroke="#181818" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="26" y="44" width="12" height="20" rx="6"/>
      <rect x="82" y="44" width="12" height="20" rx="6"/>
    </g>`;
  }
  if (tipo === 'camara') {
    return `<g>
      <path d="M46 104 L54 126" stroke="#181818" stroke-width="3.5" fill="none"/>
      <path d="M74 104 L66 126" stroke="#181818" stroke-width="3.5" fill="none"/>
      <rect x="44" y="122" width="32" height="22" rx="4" fill="#181818"/>
      <rect x="56" y="117" width="10" height="6" rx="2" fill="#181818"/>
      <circle cx="60" cy="133" r="8" fill="#2A2A2A" stroke="#555" stroke-width="1.5"/>
      <circle cx="60" cy="133" r="3.5" fill="#1FAF74" opacity=".8"/>
      <circle cx="71" cy="126" r="1.6" fill="#E0312E"/>
    </g>`;
  }
  return '';
}

export function renderAvatarSVG(cfg = AVATAR_DEFAULT, size = 160) {
  const a = { ...AVATAR_DEFAULT, ...(cfg || {}) };
  const sombra = oscurecer(a.piel, 0.82);
  const ropaSombra = oscurecer(a.ropa, 0.75);
  const detrasPelo = a.pelo === 'largo'
    ? `<path d="M34 50 C34 24 86 24 86 50 L86 100 L34 100 Z" fill="${a.colorPelo}" opacity=".9"/>`
    : '';

  return `
    <svg viewBox="0 0 120 160" width="${size}" height="${size * 160 / 120}" role="img" aria-label="Tu avatar">
      <defs>
        <clipPath id="avatar-cara"><ellipse cx="60" cy="52" rx="25" ry="29"/></clipPath>
      </defs>

      ${detrasPelo}

      <!-- cuello -->
      <rect x="52" y="72" width="16" height="24" rx="5" fill="${sombra}"/>

      <!-- torso -->
      <path d="M26 160 L26 126 C26 110 41 101 60 101 C79 101 94 110 94 126 L94 160 Z" fill="${a.ropa}"/>
      <path d="M52 101 Q60 110 68 101 L68 101 C79 101 94 110 94 126 L94 132 L26 132 L26 126 C26 110 41 101 52 101 Z" fill="${ropaSombra}" opacity=".35"/>

      <!-- cabeza -->
      <ellipse cx="60" cy="52" rx="25" ry="29" fill="${a.piel}"/>
      <ellipse cx="34" cy="55" rx="4" ry="6" fill="${sombra}"/>
      <ellipse cx="86" cy="55" rx="4" ry="6" fill="${sombra}"/>

      <!-- cara -->
      <ellipse cx="51" cy="51" rx="2.6" ry="3" fill="#141414"/>
      <ellipse cx="69" cy="51" rx="2.6" ry="3" fill="#141414"/>
      <path d="M45 42 Q51 39 56 42" stroke="${oscurecer(a.colorPelo, 0.9)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M64 42 Q69 39 75 42" stroke="${oscurecer(a.colorPelo, 0.9)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M60 55 L60 61" stroke="${sombra}" stroke-width="2" fill="none" stroke-linecap="round"/>

      ${barbaHtml(a.barba, a.colorPelo)}

      <!-- boca -->
      <path d="M52 70 Q60 76 68 70" stroke="#141414" stroke-width="2.2" fill="none" stroke-linecap="round"/>

      ${peloHtml(a.pelo, a.colorPelo)}
      ${accesorioHtml(a.accesorio, a.piel)}
    </svg>
  `;
}

export function renderAvatarEditor(cfg = AVATAR_DEFAULT) {
  const a = { ...AVATAR_DEFAULT, ...(cfg || {}) };
  const grupos = Object.keys(OPCIONES_AVATAR).map(campo => {
    const { label, tipo, valores } = OPCIONES_AVATAR[campo];
    const opciones = valores.map(v => {
      if (tipo === 'color') {
        const activo = a[campo] === v;
        return `<button class="avatar-swatch ${activo ? 'activo' : ''}" data-act="avatar-set" data-campo="${campo}" data-value="${v}" style="background:${v};" title="${v}"></button>`;
      }
      const [valor, texto] = v;
      const activo = a[campo] === valor;
      return `<button class="avatar-opt ${activo ? 'activo' : ''}" data-act="avatar-set" data-campo="${campo}" data-value="${valor}">${texto}</button>`;
    }).join('');
    return `
      <div class="avatar-grupo">
        <span class="mono-label" style="margin-bottom:6px;">${label}</span>
        <div class="avatar-opts">${opciones}</div>
      </div>
    `;
  }).join('');

  return `<div class="avatar-editor">${grupos}</div>`;
}
