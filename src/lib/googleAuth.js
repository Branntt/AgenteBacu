// OAuth compartido con Google — un solo token para todo lo que la app necesita de Google:
// hoy, el sync de Calendar (googleCalendar.js) y la importación de la Parrilla de Contenido
// desde Google Sheets (googleSheets.js). Antes esto vivía duplicado adentro de
// googleCalendar.js; se separó para que agregar Sheets no significara pedirle a la persona
// que conecte su cuenta de Google dos veces con dos botones distintos — un solo "Conectar"
// alcanza para las dos cosas, porque piden el mismo token con los dos scopes juntos.
//
// Todo corre en el navegador (esta app no tiene backend propio) vía Google Identity Services
// (GIS) — sin SDK de Google, un fetch directo a cada API REST.

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

let gisPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

function cargarGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services (¿sin conexión?).'));
    document.head.appendChild(script);
  });
  return gisPromise;
}
// Se dispara apenas se carga este módulo (con el resto de la app), no recién cuando alguien
// toca "Conectar" — si ese script se pide DESPUÉS del clic, el navegador (sobre todo en
// celular) deja de considerar la ventana emergente de Google como resultado directo de un
// toque del usuario y la bloquea en silencio: el botón queda en "Conectando…" para siempre,
// sin ningún aviso ("se quedó cargando", reportado por el usuario). Precargarlo así de
// entrada hace que, para cuando alguien realmente toca el botón, el script ya esté listo y el
// pedido de ventana emergente pase pegado al toque, como espera el navegador.
cargarGis().catch(() => {}); // sin conexión al cargar la app: no pasa nada todavía, cargarGis() se reintenta sola cuando conectar() la vuelva a llamar

function pedirToken(clientId, { prompt }) {
  const CON_TIEMPO_LIMITE = (promesa, ms, mensajeAlVencer) => {
    let vencido;
    const limite = new Promise((_, reject) => { vencido = setTimeout(() => reject(new Error(mensajeAlVencer)), ms); });
    return Promise.race([promesa, limite]).finally(() => clearTimeout(vencido));
  };

  const promesa = new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: SCOPES, callback: () => {} });
    }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt });
  });

  // Sin esto, una ventana de Google bloqueada por el navegador (o simplemente ignorada) deja
  // el pedido colgado para siempre — ni resuelve ni falla, porque el callback de Google nunca
  // llega a dispararse. Con el límite de tiempo, en vez de "cargando" eterno, a los 25s se
  // muestra un error concreto y accionable.
  return CON_TIEMPO_LIMITE(promesa, 25000, 'Google no respondió a tiempo — revisá que tu navegador no haya bloqueado la ventana emergente (buscá un ícono de "ventana bloqueada" en la barra de direcciones) e intentá de nuevo.');
}

export function estaConectado() {
  return !!accessToken && Date.now() < tokenExpiry;
}

export function getAccessToken() {
  return accessToken;
}

// Primera conexión: siempre pide consentimiento explícito (popup de Google). Si ya estaba
// conectado con el scope viejo (solo Calendar, antes de que existiera esta importación), el
// popup de Google va a pedir el consentimiento de nuevo para agregar el scope de Sheets —
// es esperado, pasa una sola vez.
export async function conectar(clientId) {
  await cargarGis();
  await pedirToken(clientId, { prompt: 'consent' });
}

// Intenta renovar el token sin popup — solo funciona si el navegador ya tiene sesión de
// Google y consentimiento previo (con los scopes actuales). Si falla, hay que llamar a
// conectar() de nuevo (con popup).
export async function reconectarSilencioso(clientId) {
  await cargarGis();
  await pedirToken(clientId, { prompt: '' });
}

export function desconectar() {
  if (accessToken && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
}
