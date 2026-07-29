# S.A.O BACU — Sistema Editorial

App de gestión de contenido/producción para un estudio audiovisual (marcas: **Brant**, **Bacu Creative**, **Novena Crew**). Dueño/usuario principal: Brandon Cárdenas (Bacu Creative).

- **Producción**: https://branntt.github.io/AgenteBacu/
- **Repo**: https://github.com/Branntt/AgenteBacu (público, rama `main`)

**⚠️ Ojo con clones duplicados del repo**: en esta máquina llegó a existir más de una copia local de este repo en rutas distintas (una quedó desactualizada mientras la otra siguió recibiendo commits reales). Antes de editar, confirmar con `git log --oneline -5` y `git remote -v` que la carpeta donde se está parado tiene el commit más reciente y coincide con lo que corre el `devserver.py` activo (revisar qué proceso tiene el puerto local ocupado si hay dudas) — si el nav de la app muestra pestañas que no aparecen en el código que se está leyendo, es la señal de que se está en la copia equivocada.

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

Requiere **login** (email/contraseña, Supabase Auth). Sin sesión no se ve nada. Tablas: `ideas`, `clientes`, `snaps`, `cuentas_cobro`, `movimientos_financiamiento`, `deudas`, `pagos_mensuales`, `metas_personales`, `metas_mensuales`, `tareas` — todas con RLS "solo autenticados", y suscripción realtime (cambios de otros usuarios se reflejan solos).

El email de login se recuerda solo (se guarda en localStorage tras cada intento, `sistemaEditorial.ultimoEmail`, y prellena el campo). La contraseña **nunca se guarda en código** — el input ya tiene `autocomplete="current-password"`, eso basta para que el gestor de contraseñas del navegador/SO la ofrezca. No construir un guardado propio de contraseña.

Los scripts SQL de setup están en la raíz del repo:
- `supabase-schema.sql` — esquema inicial (ya corrido).
- `supabase-migracion-cuentas-cobro.sql` — agrega `clientes.documento` + tabla `cuentas_cobro` (**puede que el usuario todavía no la haya corrido** — si algo relacionado a cuentas de cobro no persiste, es probablemente por esto; no es un bug de código).
- `supabase-migracion-cuenta-cobro-v2.sql` — agrega `fecha_vencimiento` y `observaciones` a `cuentas_cobro`.
- `supabase-migracion-fecha-grabacion-cliente.sql` — agrega `fecha_grabacion` a `clientes`.
- `supabase-migracion-financiamiento.sql` — tabla `movimientos_financiamiento`. **Corrida el 2026-07-25** (confirmado: el asistente entró al SQL Editor de Supabase con el usuario y la ejecutó).
- `supabase-migracion-panorama.sql` — tablas `metas_personales`, `metas_mensuales`, `tareas`. **Corrida el 2026-07-25**.
- `supabase-migracion-deudas.sql` — tabla `deudas`, junto con la corrección del modelo de Financiamiento (ver abajo). **Corrida el 2026-07-25**.
- `supabase-migracion-pagos-mensuales.sql` — tabla `pagos_mensuales` (suscripciones/pagos recurrentes: nombre, monto, día del mes; **puede que el usuario todavía no la haya corrido** — agregada el 2026-07-25, es solo referencia, no afecta el cálculo de patrimonio).
- `supabase-migracion-tareas-fecha.sql` — agrega `fecha` (date, opcional) a `tareas`.
- `supabase-migracion-cuenta-cobro-pagada.sql` — agrega `pagada` (bool, default false) a `cuentas_cobro` (**puede que el usuario todavía no la haya corrido** — agregada el 2026-07-27; si "Marcar pagada" en una cuenta de cobro no persiste, es por esto, no un bug de código).
- `supabase-migracion-deuda-fecha-limite.sql` — agrega `fecha_limite` (date, opcional) a `deudas`. **Casi seguro que el usuario todavía no la ha corrido** — agregada el 2026-07-28, junto con el peso de estrés por deuda atrasada en `lib/bienestar.js`. Sin correr esto, el campo de fecha límite en la tarjeta de deuda (Financiamiento) falla al guardar (banner de error), no es un bug de código.

Credenciales (URL + anon key) están hardcodeadas en `src/lib/supabaseClient.js` — es intencional, la anon key es pública/segura para frontend, protegida por RLS. **Nunca pedir ni usar la `service_role` key** — es privada, el usuario no debe compartirla.

**Seguridad — registro cerrado (2026-07-25)**: las 10 tablas tienen la misma política RLS ("cualquier usuario autenticado tiene acceso total", no está limitada por usuario — ver política `"authenticated full access"` en cada tabla). Eso es seguro solo porque el registro público de usuarios está **deshabilitado** en Supabase (Authentication → Sign In/Providers → "Allow new users to sign up" = OFF, desactivado en esta fecha tras auditoría de seguridad). Como el repo es público (URL + anon key visibles), si alguien reactivara el registro, cualquiera podría crear una cuenta y esa política le daría acceso total a todos los datos. **No reactivar "Allow new users to sign up" sin antes reescribir las políticas RLS para que sean por usuario** (ej. columna `user_id` + `using (auth.uid() = user_id)` en cada tabla). Solo existe una cuenta real (la del usuario); se borró una cuenta de prueba (`@mailinator.com`) que quedó de una verificación anterior. Auditoría de XSS del mismo día: todo el código escapa correctamente con `escapeHtml()`, sin huecos encontrados.

## Corriendo en local

No abrir `index.html` directo (rompe por CORS de ES modules). Usar el server incluido:

```bash
python3 devserver.py 4174 .
```

Sirve con headers `no-store` — importante porque **GitHub Pages + el navegador cachean agresivamente** y varias veces en el desarrollo de esto un cambio "no aparecía" y en realidad sí estaba publicado, solo cacheado. Ante ese síntoma: primero descartar caché (probar con query string nueva, `?v=timestamp`) antes de asumir que algo falló.

## Convenciones de diseño

Tema oscuro "Cine crudo" (negro puro) o claro "Galería clara", variables CSS en `src/styles/tokens.css`. Tipografía: IBM Plex Mono (labels/mono), Instrument Serif (títulos), Space Grotesk (cuerpo). Mobile-first, breakpoints en `src/styles/main.css` (600/900/1200/1600/1920px). Componentes de lista → grilla con scroll horizontal en mobile (mismo patrón en Guiones, filtros).

## Features ya construidas

Calendario (vistas Mes/Semana/Agenda, fechas de publicación y de rodaje separadas, rodaje rápido con un clic en el día, y las fechas de grabación cargadas desde Clientes), Guiones (fusión de lo que antes eran "Banco" y "Desarrollo" — un selector alterna entre "Vista general", kanban por estado, y "Por tipo de guion", columnas por familia solo para ideas en desarrollo; incluye "Cubrimiento" sin guion, solo notas), Clientes (tablero kanban por estado — ver detalle abajo — con cuentas de cobro generables en PDF, historial de cuentas, y fecha de grabación que alimenta el Calendario), Financiamiento (patrimonio neto estimado — ver detalle abajo), Panorama (dashboard personal — ver detalle abajo, incluye lo que antes era la pestaña Seguimiento).

**Financiamiento y Gmail**: el usuario pidió que las transacciones de Bancolombia/Nequi salieran de leer su Gmail. Esto **no está automatizado** — la app es estática (sin backend), no puede autenticarse contra Gmail por su cuenta. Lo que sí puede pasar: en una sesión de chat donde el usuario conecte Gmail como conector de Claude, el asistente puede leer correos puntuales de esos bancos y cargar los montos a mano en la pestaña. Si se retoma este proyecto, no asumir que existe una sincronización real — confirmar con el usuario antes de construir un pipeline OAuth con Gmail (proyecto grande aparte: backend, Google Cloud, parseo de correos).

**Financiamiento — historial del modelo de cálculo**: la versión original sumaba `cuentas_cobro.total` como si fuera dinero disponible ("$6.900.000 de bolsillo"), pero el usuario aclaró que facturar no es cobrar (2026-07-25). Luego, un intento de arreglar "Te deben" para que sí contara cuentas de cobro pendientes (2026-07-27) volvió a sumar **todas** las cuentas de cobro sin filtrar, lo que doble-contaba clientes que ya habían pagado (esa plata ya estaba en `efectivo` vía el movimiento automático). Modelo actual (2026-07-27), en `src/lib/financiamiento.js`:
- `cuentas_cobro` tiene su propio campo `pagada` (bool) — el estado de pago vive en la **factura**, no en el cliente. Esto importa con clientes recurrentes (ej. Sebastian Arcon, que factura mes a mes): pueden tener facturas viejas pagadas y una nueva sin pagar al mismo tiempo, y el kanban del cliente (un solo estado) no alcanza para distinguir eso.
- `cuentasCobroPendientes(cuentasCobro)` → filtra por `!pagada`. `calcularFinanciamiento(movimientos, deudas, cuentasCobro)` → `{efectivo, debes, teDeben, patrimonio}`, donde `teDeben` = cuentas de cobro pendientes + deudas `me_deben` sin pagar, y `patrimonio = efectivo + teDeben - debes` es lo único que cuenta como "bolsillo" real. `calcularFacturado(cuentasCobro)` sigue siendo solo referencia (todo lo facturado alguna vez, pagado o no).
- Marcar una factura pagada es la acción `toggleCuentaCobroPagada` (`store.js`) — pone `pagada: true` **y** registra el ingreso en `movimientos_financiamiento` automáticamente. Mover un cliente a `ya_pagos` en el kanban reutiliza esta misma acción para todas sus facturas aún pendientes (no las que ya estaban marcadas pagadas individualmente) — un solo camino de código para "esto ya me lo pagaron", no dos caminos que se puedan desincronizar.
- **Si se vuelve a tocar este archivo**: `teDeben` debe salir de `cuentasCobroPendientes`, nunca de sumar `cuentas_cobro` completo ni de mirar `cliente.estado` — ya se corrigió dos veces por esta razón. `deudas` tiene `direccion: 'debo' | 'me_deben'` y `pagada` (bool, se queda visible atenuada al marcarla, no se borra sola; el botón "Marcar pagada" en Financiamiento llama a `toggleDeudaPagada`).
- **Pantalla de Financiamiento (2026-07-27)**: a pedido del usuario ("quiero confiar plenamente en el número"), se quitaron la simulación "si vivieras solo" y el desglose de "aseo personal" (hipotéticos, no plata real) y se agregó la sección "Quién te debe" (lista de facturas pendientes + deudas a favor, cada una con botón para marcar pagada). No reintroducir esas secciones hipotéticas sin que el usuario lo pida — el objetivo explícito de este cambio fue que la pantalla muestre solo plata real.

**Panorama** es un dashboard de "cómo voy" en general, no solo de las marcas: "Esta semana" (etiqueta Al día/Con pendientes/Cargado — calculada contando ideas de prioridad alta sin fecha, NO es un dato de ánimo real, es un proxy de organización que el usuario aceptó como aproximación), "Tu bolsillo" (mismo `calcularFinanciamiento` que Financiamiento — patrimonio neto, no el total facturado), Tareas (checklist visual estilo "cintas de colores en la pared" — el usuario literalmente tiene un sistema físico de cintas de colores para pendientes; `tarea.color` rota entre `COLORES_TAREA` en `constants.js` al crear, no es editable después), Metas personales (tres columnas fijas: objeto/logro/destreza — el usuario quería incluir metas de vida como graduarse, separadas de lo laboral), y Objetivo mensual por marca (input numérico dentro de cada `.marca-card`; ese input vive dentro de un contenedor `[data-act="marca-abrir"]`, así que usa `data-no-nav` para que escribir ahí no dispare la navegación — cualquier control interactivo nuevo dentro de una marca-card necesita el mismo tratamiento).

**Clientes se rediseñó como kanban** (2026-07-25): antes era una sola grilla con tarjetas grandes editables en línea; ahora es un tablero `.banco-grid`/`.banco-col` (mismo patrón visual que Guiones) con 4 columnas por `estado` (prospecto → conversación → activo → entregado) y una línea de stats arriba ("N prospectos · N en conversación..."). Las tarjetas del tablero son compactas (`.cliente-card-mini`, solo nombre + proyecto) y al tocarlas abren `src/components/clienteDetalle.js` — un drawer nuevo con todos los campos (antes vivían en la tarjeta grande). Estado nuevo: `state.clienteSelId`. La vieja CSS de `.cliente-card`/`.clientes-grid` se eliminó por quedar huérfana. El drawer muestra "Facturado en total" (suma de `cuentasCobro` filtradas por `cliente_id`, calculada al vuelo, no es un campo guardado) cuando el cliente tiene al menos una cuenta de cobro.

**Rodaje rápido con cliente + cuenta de cobro automática** (2026-07-25): el drawer de rodaje rápido (`src/components/rodajeRapido.js`) tiene 3 campos opcionales — cliente, C.C./NIT, precio — además de los originales (qué se graba, marca, fecha). Al guardar (`rodajeRapidoGuardar` en `store.js`), si hay nombre de cliente: busca un cliente existente por nombre (case-insensitive, trim) y si no existe lo crea con `estado: 'activo'`; si hay precio > 0, genera una cuenta de cobro igual que el flujo manual de Clientes (mismo numerado por mes, mismo PDF). Repetir el mismo nombre de cliente en varios rodajes no duplica el cliente — cada trabajo queda como una cuenta de cobro más ligada al mismo `cliente_id`, y el total facturado (ver arriba) los va sumando solo. **Importante**: el cliente creado desde acá NO recibe `fecha_grabacion` — esa fecha ya la cubre la idea/rodaje que se crea en paralelo (`fechaRodaje`), y `entradasDeDia` en `calendario.js` mezcla ambas fuentes; ponerle `fecha_grabacion` también duplicaría la entrada en el Calendario ese día.

**Seguimiento se fusionó dentro de Panorama** (2026-07-25, `src/views/seguimiento.js` fue eliminado). Ya no existe como pestaña ni entrada de `VIEWS`/nav. Su contenido quedó repartido en `panorama.js`: los registros de seguidores/alcance por marca (`state.snaps`, botón "+ Registro", `snap-abre`/`snap-guarda`) ahora viven dentro de cada `.marca-card` (bloque `.marca-seguimiento`, reusa las clases CSS `.cuenta-*` que antes eran solo de Seguimiento) junto al objetivo mensual; "Enfoque de crecimiento", "Historial de seguidores" y "Qué funcionó" quedaron como sección propia (`.seg-bottom`) debajo de "Las marcas". Todas las acciones (`snap-*`) siguen intactas en `store.js`/`main.js`, solo cambió desde qué vista se disparan.

**Horario de clases en el Calendario** (agregado): `HORARIO_CLASES` en `constants.js` es un horario semanal fijo hardcodeado (día ISO 1-7, hora inicio/fin, materia, profesor, salón) con un rango de fechas de semestre (`inicio`/`fin`); no vive en Supabase porque es un dato de un solo semestre que el usuario pasó una vez, no algo que edite seguido. `calendario.js` lo repite cada semana dentro del rango y lo mezcla en `entradasDeDia` junto con ideas/grabaciones, con su propio color (`--azul`, token nuevo en `tokens.css`) y clase `.is-clase` (borde punteado, sin acción al tocar). Si el usuario cambia de semestre, hay que reemplazar el array a mano.

**Tareas con fecha de entrega → Calendario** (agregado): `tareas.fecha` (opcional, columna nueva vía `supabase-migracion-tareas-fecha.sql`) — si una tarea de Panorama tiene fecha y no está marcada `hecha`, aparece también en el Calendario ese día con tag "ENTREGA" y color `--rojo` (`.is-tarea`), y desaparece del Calendario sola al marcarla hecha (sigue viva en Panorama). Pensado para que el celular muestre de un vistazo, en el mini-mes compacto (barras de color sin texto en <600px), qué hay que entregar sin entrar a Panorama.

## Deploy

Push a `main` dispara build de GitHub Pages automático (a veces tarda o no dispara — si hace falta, se puede forzar con `POST /repos/Branntt/AgenteBacu/pages/builds` vía API con un token). El usuario prefiere que los cambios se publiquen solos, sin pasos manuales de su parte — se configuró una llave SSH local para pushear sin pedir token cada vez.
