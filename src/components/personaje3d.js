// Prototipo de personaje 3D (Inventario > Personal, beta) — visor con Three.js + creador
// con Avaturn (servicio externo, sin cuenta necesaria; reemplaza a Ready Player Me, que
// cerró en 2026 tras ser comprado por Netflix).
//
// Three.js/Avaturn se cargan de forma diferida (import() dinámico) — nunca en el arranque
// de la app, solo cuando el usuario realmente entra a esta sección — para no afectar la
// velocidad de carga del resto de la app.
//
// El resto de la app reconstruye TODO el DOM en cada cambio de estado (ver render() en
// main.js), lo cual destruiría un canvas WebGL en cada render si no se maneja aparte. Por
// eso el renderer/escena/SDK viven en variables de módulo (no se recrean) y hay una función
// `sincronizarPersonaje3D`, llamada después de cada render (igual que restaurarFoco), que
// reengancha el canvas/iframe existente al contenedor recién creado — o los pausa/destruye
// si el usuario salió de la vista, para no seguir gastando GPU/batería de fondo.
import { actions } from '../state/store.js';

const THREE_VERSION = '0.160.0';
// Se cachea la PROMESA, no el resultado — sincronizarPersonaje3D puede llamarse varias
// veces seguidas (una por cada render()) antes de que termine la primera carga; cachear
// solo el resultado dejaba que cada llamada de-en-medio disparara su propia importación
// duplicada ("Multiple instances of Three.js being imported").
let threePromise = null;
let avaturnPromise = null;

// esm.sh (no unpkg): reescribe los imports internos de cada addon (ej. GLTFLoader hace
// `import ... from 'three'`) a URLs resueltas — unpkg sirve los archivos tal cual, sin
// resolver ese specifier "desnudo", y como esto se importa de forma diferida (sin
// <script type="importmap"> declarado de antemano) no hay quien lo resuelva. Ver historial:
// esto rompía en silencio (TypeError: Failed to resolve module specifier "three").
function cargarThree() {
  if (threePromise) return threePromise;
  const base = `https://esm.sh/three@${THREE_VERSION}`;
  threePromise = Promise.all([
    import(/* @vite-ignore */ base),
    import(/* @vite-ignore */ `${base}/examples/jsm/loaders/GLTFLoader.js`),
    import(/* @vite-ignore */ `${base}/examples/jsm/controls/OrbitControls.js`),
    import(/* @vite-ignore */ `${base}/examples/jsm/environments/RoomEnvironment.js`)
  ]).then(([THREE, loaderMod, controlsMod, envMod]) =>
    ({ THREE, GLTFLoader: loaderMod.GLTFLoader, OrbitControls: controlsMod.OrbitControls, RoomEnvironment: envMod.RoomEnvironment })
  ).catch(err => { threePromise = null; throw err; }); // si falla, la próxima llamada puede reintentar
  return threePromise;
}

function cargarAvaturn() {
  if (avaturnPromise) return avaturnPromise;
  avaturnPromise = import(/* @vite-ignore */ 'https://esm.sh/@avaturn/sdk')
    .catch(err => { avaturnPromise = null; throw err; });
  return avaturnPromise;
}

// ---------------- Visor (muestra el avatar ya guardado) ----------------

let visor = null; // { renderer, scene, camera, controls, THREE, modelo }
let glbCargado = null;
let visorRafId = null;
let visorCreando = false;

function crearVisor(THREE, OrbitControls, RoomEnvironment, host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const luz = new THREE.DirectionalLight(0xffffff, 1.2);
  luz.position.set(2, 4, 3);
  scene.add(luz);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.4, 3);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, 0);
  controls.enableDamping = true;
  controls.minDistance = 1;
  controls.maxDistance = 8;

  ajustarTamano(renderer, camera, host);
  return { renderer, scene, camera, controls, modelo: null };
}

function ajustarTamano(renderer, camera, host) {
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function loopVisor() {
  const host = document.getElementById('personaje3d-canvas-host');
  if (!host || !visor) { visorRafId = null; return; } // salió de la vista: pausar, no seguir de fondo
  if (visor.renderer.domElement.parentElement !== host) {
    host.appendChild(visor.renderer.domElement);
    ajustarTamano(visor.renderer, visor.camera, host);
  }
  visor.controls.update();
  visor.renderer.render(visor.scene, visor.camera);
  visorRafId = requestAnimationFrame(loopVisor);
}

async function cargarModeloEnVisor(url) {
  const { GLTFLoader } = await cargarThree();
  new GLTFLoader().load(url, (gltf) => {
    if (!visor) return;
    if (visor.modelo) visor.scene.remove(visor.modelo);
    visor.modelo = gltf.scene;
    visor.scene.add(visor.modelo);
  }, undefined, (err) => console.error('[Personaje3D] error cargando avatar guardado', err));
}

export function renderPersonaje3DViewer(state) {
  if (!state.avatarGlbUrl) {
    return `
      <div class="personaje3d-vacio">
        <button class="btn-ghost" data-act="personaje3d-abrir" style="min-height:0;font-size:11px;padding:7px 12px;">🧍 Crear personaje 3D (beta)</button>
      </div>
    `;
  }
  return `
    <div class="personaje3d-wrap">
      <div class="personaje3d-canvas-host" id="personaje3d-canvas-host"></div>
      <button class="btn-ghost" data-act="personaje3d-abrir" style="margin-top:8px;min-height:0;font-size:11px;padding:7px 12px;">✎ Rehacer personaje</button>
    </div>
  `;
}

// ---------------- Creador (drawer con el widget de Avaturn) ----------------

let avaturnSdk = null;
let avaturnListo = false;

export function renderPersonaje3DCreador(state) {
  if (!state.personaje3dAbierto) return '';
  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="personaje3d-cerrar"></div>
      <div class="drawer personaje3d-creador" role="dialog" aria-modal="true" aria-label="Crear personaje 3D">
        <div class="drawer-top">
          <span class="chip">Personaje 3D — beta</span>
          <button class="btn-close" data-act="personaje3d-cerrar">✕</button>
        </div>
        <div class="personaje3d-creador-stage" id="personaje3d-creator-host"></div>
        <div class="panel-footnote" style="margin:0;">Widget externo (Avaturn) — no pide cuenta. Subí una foto o armalo a mano y tocá "Next" ahí adentro para guardarlo.</div>
      </div>
    </div>
  `;
}

let creadorIniciando = false;

async function inicializarCreador(host) {
  creadorIniciando = true;
  try {
    const { AvaturnSDK } = await cargarAvaturn();
    // El drawer pudo cerrarse mientras el SDK cargaba (import diferido) — re-chequear el
    // DOM en vez de confiar en una referencia de estado que puede haber quedado vieja.
    if (!document.getElementById('personaje3d-creator-host')) return;
    avaturnSdk = new AvaturnSDK();
    await avaturnSdk.init(host, { iframeClassName: 'avaturn-iframe' });
    avaturnSdk
      .on('load', () => { avaturnListo = true; })
      .on('export', (data) => { actions.personaje3dSetGlb(data.url); })
      .on('error', (err) => console.error('[Personaje3D] error de Avaturn', err));
  } catch (e) {
    console.error('[Personaje3D] no se pudo iniciar el creador', e);
  } finally {
    creadorIniciando = false;
  }
}

async function destruirCreador() {
  const sdk = avaturnSdk;
  avaturnSdk = null;
  avaturnListo = false;
  if (sdk) { try { await sdk.destroy(); } catch (e) {} }
}

// ---------------- Sincronización post-render (llamar desde main.js, como restaurarFoco) ----------------

export function sincronizarPersonaje3D(state) {
  // Visor
  const hostViewer = document.getElementById('personaje3d-canvas-host');
  if (hostViewer && state.avatarGlbUrl) {
    if (!visor && !visorCreando) {
      visorCreando = true;
      cargarThree().then(({ THREE, OrbitControls, RoomEnvironment }) => {
        visorCreando = false;
        if (visor) return; // ya se creó en otra llamada mientras esta cargaba
        if (!document.getElementById('personaje3d-canvas-host')) return; // se cerró mientras cargaba
        visor = crearVisor(THREE, OrbitControls, RoomEnvironment, hostViewer);
        hostViewer.appendChild(visor.renderer.domElement);
        cargarModeloEnVisor(state.avatarGlbUrl);
        glbCargado = state.avatarGlbUrl;
        if (visorRafId === null) loopVisor();
      }).catch(() => { visorCreando = false; });
    } else if (visor) {
      if (visor.renderer.domElement.parentElement !== hostViewer) hostViewer.appendChild(visor.renderer.domElement);
      if (state.avatarGlbUrl !== glbCargado) { glbCargado = state.avatarGlbUrl; cargarModeloEnVisor(state.avatarGlbUrl); }
      if (visorRafId === null) loopVisor();
    }
  }

  // Creador
  const hostCreador = document.getElementById('personaje3d-creator-host');
  if (state.personaje3dAbierto && hostCreador) {
    if (!avaturnSdk && !creadorIniciando) inicializarCreador(hostCreador);
  } else if (!state.personaje3dAbierto && avaturnSdk) {
    destruirCreador();
  }
}
