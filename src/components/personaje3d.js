// Prototipo de personaje 3D mejorado — visor con Three.js + creador con Avaturn
// Mejoras: cámara fija vertical, animaciones (parpadeos, respiración, movimientos sutiles)
import { actions } from '../state/store.js';

const THREE_VERSION = '0.160.0';
let threePromise = null;
let avaturnPromise = null;

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
  ).catch(err => { threePromise = null; throw err; });
  return threePromise;
}

function cargarAvaturn() {
  if (avaturnPromise) return avaturnPromise;
  avaturnPromise = import(/* @vite-ignore */ 'https://esm.sh/@avaturn/sdk')
    .catch(err => { avaturnPromise = null; throw err; });
  return avaturnPromise;
}

const DB_NOMBRE = 'agentebacu-personaje3d';
const DB_STORE = 'avatar';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOMBRE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarEnDB(blob) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(blob, 'actual');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function leerDeDB() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get('actual');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(tx.error);
  });
}

async function borrarDeDB() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete('actual');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let dbRevisada = false;
async function revisarGuardado() {
  if (dbRevisada) return;
  dbRevisada = true;
  try {
    const blob = await leerDeDB();
    if (blob) actions.personaje3dSetGlb(URL.createObjectURL(blob));
  } catch (e) { }
}

let ultimoGlbUrl;
function sincronizarGuardado(state) {
  if (ultimoGlbUrl !== undefined && ultimoGlbUrl && !state.avatarGlbUrl) {
    borrarDeDB().catch(() => {});
  }
  ultimoGlbUrl = state.avatarGlbUrl;
}

// ---------- Visor mejorado con animaciones ----------

let visor = null;
let glbCargado = null;
let visorRafId = null;
let visorCreando = false;
let tiempoAnimacion = 0;

// Animaciones: parpadeos, respiración, movimientos sutiles
function actualizarAnimaciones(visor) {
  if (!visor.modelo) return;

  tiempoAnimacion += 0.016; // ~60fps

  // Parpadeo: cada 3-4 segundos, cierra los ojos rápido
  const parpadeoTiempo = Math.sin(tiempoAnimacion * 0.3) * Math.PI;
  const parpadeoIntensidad = Math.max(0, Math.sin(parpadeoTiempo * 20) * 0.15);

  // Respiración suave: pequeño movimiento en el pecho
  const respiracion = Math.sin(tiempoAnimacion * 1.5) * 0.05;

  // Movimiento sutil: pequeño swaying side to side
  const sway = Math.sin(tiempoAnimacion * 0.8) * 0.02;

  // Aplicar animaciones al modelo
  visor.modelo.position.y = respiracion;
  visor.modelo.rotation.z = sway * 0.3;

  // Buscar huesos de los ojos para parpadeo (si existen)
  visor.modelo.traverse(obj => {
    if (obj.isMesh && (obj.name.includes('Eye') || obj.name.includes('eye'))) {
      if (obj.scale) obj.scale.y = Math.max(0.1, 1 - parpadeoIntensidad);
    }
  });
}

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

  // OrbitControls modificado: solo permite rotación horizontal (eje Y)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, 0);
  controls.enableDamping = true;
  controls.minDistance = 2;
  controls.maxDistance = 4;
  controls.autoRotate = false;

  // Bloquear rotación vertical (pitch)
  controls.minPolarAngle = Math.PI / 2; // Horizonte
  controls.maxPolarAngle = Math.PI / 2; // Horizonte (sin movimiento arriba/abajo)
  controls.enableZoom = false; // Deshabilitar zoom
  controls.enablePan = false; // Deshabilitar pan

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
  if (!host || !visor) { visorRafId = null; return; }
  if (visor.renderer.domElement.parentElement !== host) {
    host.appendChild(visor.renderer.domElement);
    ajustarTamano(visor.renderer, visor.camera, host);
  }
  visor.controls.update();
  actualizarAnimaciones(visor);
  visor.renderer.render(visor.scene, visor.camera);
  visorRafId = requestAnimationFrame(loopVisor);
}

function rotarEnEjeMundial(THREE, obj, ejeMundial, angulo) {
  const deltaMundial = new THREE.Quaternion().setFromAxisAngle(ejeMundial, angulo);
  const qPadreMundial = new THREE.Quaternion();
  obj.parent.getWorldQuaternion(qPadreMundial);
  const deltaLocal = qPadreMundial.clone().invert().multiply(deltaMundial).multiply(qPadreMundial);
  obj.quaternion.premultiply(deltaLocal);
}

function relajarPose(THREE, escena) {
  const eje = new THREE.Vector3(0, 0, 1);
  const angulo = THREE.MathUtils.degToRad(75);
  let brazosEncontrados = 0;
  escena.traverse(obj => {
    if (obj.name === 'LeftArm') { rotarEnEjeMundial(THREE, obj, eje, -angulo); brazosEncontrados++; }
    if (obj.name === 'RightArm') { rotarEnEjeMundial(THREE, obj, eje, angulo); brazosEncontrados++; }
  });
  if (brazosEncontrados < 2) console.warn('[Personaje3D] no se encontraron LeftArm/RightArm');
}

async function cargarModeloEnVisor(url) {
  const { THREE, GLTFLoader } = await cargarThree();
  new GLTFLoader().load(url, (gltf) => {
    if (!visor) return;
    if (visor.modelo) visor.scene.remove(visor.modelo);
    relajarPose(THREE, gltf.scene);
    visor.modelo = gltf.scene;
    visor.scene.add(visor.modelo);
  }, undefined, (err) => console.error('[Personaje3D] error cargando avatar', err));
}

export function renderPersonaje3DViewer(state) {
  if (!state.avatarGlbUrl) {
    return `
      <div class="personaje3d-vacio">
        <button class="btn-ghost" data-act="personaje3d-abrir" style="min-height:0;font-size:11px;padding:7px 12px;">🧍 Crear personaje 3D</button>
      </div>
    `;
  }
  return `
    <div class="personaje3d-wrap">
      <div class="personaje3d-canvas-host" id="personaje3d-canvas-host"></div>
      <div class="personaje3d-botones">
        <button class="btn-ghost" data-act="personaje3d-abrir" style="min-height:0;font-size:11px;padding:7px 12px;">✎ Rehacer</button>
        <button class="btn-text-muted" data-act="personaje3d-reset" style="min-height:0;font-size:11px;padding:7px 12px;">🗑 Borrar</button>
      </div>
    </div>
  `;
}

// ---------- Creador ----------

let avaturnSdk = null;
let avaturnListo = false;

export function renderPersonaje3DCreador(state) {
  if (!state.personaje3dAbierto) return '';
  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="personaje3d-cerrar"></div>
      <div class="drawer personaje3d-creador" role="dialog" aria-modal="true" aria-label="Crear personaje 3D">
        <div class="drawer-top">
          <span class="chip">Personaje 3D</span>
          <button class="btn-close" data-act="personaje3d-cerrar">✕</button>
        </div>
        <div class="personaje3d-creador-stage" id="personaje3d-creator-host"></div>
        <div class="panel-footnote" style="margin:0;">Widget externo (Avaturn) — subí una foto o armalo a mano. Tocá "Next" para guardarlo.</div>
      </div>
    </div>
  `;
}

let creadorIniciando = false;

async function inicializarCreador(host) {
  creadorIniciando = true;
  try {
    const { AvaturnSDK } = await cargarAvaturn();
    if (!document.getElementById('personaje3d-creator-host')) return;
    avaturnSdk = new AvaturnSDK();
    await avaturnSdk.init(host, { iframeClassName: 'avaturn-iframe' });
    avaturnSdk
      .on('load', () => { avaturnListo = true; })
      .on('export', (data) => {
        actions.personaje3dSetGlb(data.url);
        if (data.urlType === 'dataURL') {
          fetch(data.url).then(r => r.blob()).then(guardarEnDB)
            .catch(err => console.error('[Personaje3D] error guardando', err));
        }
      })
      .on('error', (err) => console.error('[Personaje3D] error Avaturn', err));
  } catch (e) {
    console.error('[Personaje3D] error iniciando creador', e);
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

export function sincronizarPersonaje3D(state) {
  revisarGuardado();
  sincronizarGuardado(state);

  const hostViewer = document.getElementById('personaje3d-canvas-host');
  if (hostViewer && state.avatarGlbUrl) {
    if (!visor && !visorCreando) {
      visorCreando = true;
      cargarThree().then(({ THREE, OrbitControls, RoomEnvironment }) => {
        visorCreando = false;
        if (visor) return;
        if (!document.getElementById('personaje3d-canvas-host')) return;
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

  const hostCreador = document.getElementById('personaje3d-creator-host');
  if (state.personaje3dAbierto && hostCreador) {
    if (!avaturnSdk && !creadorIniciando) inicializarCreador(hostCreador);
  } else if (!state.personaje3dAbierto && avaturnSdk) {
    destruirCreador();
  }
}
