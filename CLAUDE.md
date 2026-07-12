# S.A.O BACU — Sistema Editorial

App de gestión de contenido/producción para un estudio audiovisual (marcas: **Brant**, **Bacu Creative**, **Novena Crew**). Dueño/usuario principal: Brandon Cárdenas (Bacu Creative).

- **Producción**: https://branntt.github.io/AgenteBacu/
- **Repo**: https://github.com/Branntt/AgenteBacu (público, rama `main`)

## Stack

Vanilla JS puro. **Sin build, sin npm, sin bundler.** Todo son ES modules servidos tal cual. Dependencias externas (Supabase, jsPDF) se cargan vía `import` directo desde `esm.sh` en el navegador — no hay `node_modules`.

## Arquitectura

- `src/state/store.js` — un solo objeto `state` mutable + `actions` (funciones que mutan `state` y llaman `notify()`). Patrón optimista: se actualiza `state` local primero, después se escribe a Supabase en segundo plano; si falla, se prende `state.saveError` y aparece un banner.
- `src/main.js` — `render()` reconstruye TODO el DOM vía `innerHTML` en cada cambio de estado (no hay virtual DOM). Delegación de eventos con atributos `data-act` (clicks) y `data-change` (inputs/selects, se disparan en `change`, no en `input`, para no perder el foco). Hay lógica para preservar foco/cursor entre renders (`capturarFoco`/`restaurarFoco`).
- `src/views/*.js` — una función `renderX(state)` por pestaña, devuelve un string de HTML.
- `src/components/*.js` — drawers/modales reutilizables (detalle de idea, editor de guion, rodaje rápido, cuenta de cobro, login).
- `src/data/constants.js` — catálogos fijos: MARCAS, FORMATOS, FAMILIAS_GUION (clasificación de guiones por tipo), EMISOR (datos fijos de quien factura).
- `src/lib/` — helpers puros: fechas (`idea.js`), formato de números, `supabaseClient.js`, `pdfInvoice.js` (genera cuentas de cobro en PDF client-side con jsPDF).

## Backend: Supabase

Requiere **login** (email/contraseña, Supabase Auth). Sin sesión no se ve nada. Tablas: `ideas`, `clientes`, `snaps`, `cuentas_cobro` — todas con RLS "solo autenticados", y suscripción realtime (cambios de otros usuarios se reflejan solos).

Los scripts SQL de setup están en la raíz del repo:
- `supabase-schema.sql` — esquema inicial (ya corrido).
- `supabase-migracion-cuentas-cobro.sql` — agrega `clientes.documento` + tabla `cuentas_cobro` (**puede que el usuario todavía no la haya corrido** — si algo relacionado a cuentas de cobro no persiste, es probablemente por esto; no es un bug de código).

Credenciales (URL + anon key) están hardcodeadas en `src/lib/supabaseClient.js` — es intencional, la anon key es pública/segura para frontend, protegida por RLS. **Nunca pedir ni usar la `service_role` key** — es privada, el usuario no debe compartirla.

## Corriendo en local

No abrir `index.html` directo (rompe por CORS de ES modules). Usar el server incluido:

```bash
python3 devserver.py 4174 .
```

Sirve con headers `no-store` — importante porque **GitHub Pages + el navegador cachean agresivamente** y varias veces en el desarrollo de esto un cambio "no aparecía" y en realidad sí estaba publicado, solo cacheado. Ante ese síntoma: primero descartar caché (probar con query string nueva, `?v=timestamp`) antes de asumir que algo falló.

## Convenciones de diseño

Tema oscuro "Cine crudo" (negro puro) o claro "Galería clara", variables CSS en `src/styles/tokens.css`. Tipografía: IBM Plex Mono (labels/mono), Instrument Serif (títulos), Space Grotesk (cuerpo). Mobile-first, breakpoints en `src/styles/main.css` (600/900/1200/1600/1920px). Componentes de lista → grilla con scroll horizontal en mobile (mismo patrón en Banco, Desarrollo, filtros).

## Features ya construidas

Calendario (vistas Mes/Semana/Agenda, fechas de publicación y de rodaje separadas, rodaje rápido con un clic en el día), Banco de ideas (kanban por estado), Desarrollo (clasificación de guiones por familia — incluye "Cubrimiento" sin guion, solo notas), Clientes (con cuentas de cobro generables en PDF), Seguimiento (métricas de redes), Panorama (overview).

## Deploy

Push a `main` dispara build de GitHub Pages automático (a veces tarda o no dispara — si hace falta, se puede forzar con `POST /repos/Branntt/AgenteBacu/pages/builds` vía API con un token). El usuario prefiere que los cambios se publiquen solos, sin pasos manuales de su parte — se configuró una llave SSH local para pushear sin pedir token cada vez.
