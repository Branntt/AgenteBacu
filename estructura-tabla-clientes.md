# Estructura de la tabla `clientes` (Supabase)

Documento de referencia / soporte de datos. Describe las columnas reales de la tabla `clientes` tal como quedó después de `supabase-schema.sql` + `supabase-migracion-cuentas-cobro.sql`.

## Columnas

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `text` (PK) | — | Identificador único del cliente. |
| `nombre` | `text` | `''` | Nombre del cliente. |
| `estado` | `text` | `'prospecto'` | Etapa del cliente en el pipeline. Valores usados por la app: `prospecto`, `conversacion`, `activo`, `entregado`. |
| `proyecto` | `text` | `''` | Proyecto o servicio en curso con ese cliente. |
| `documento` | `text` | `''` | C.C. / NIT del cliente, usado al generar cuentas de cobro. Agregada por la migración. |
| `nota` | `text` | `''` | Siguiente paso concreto / nota libre. |
| `updated_at` | `timestamptz` | `now()` | Última actualización del registro. |

## Seguridad

- Row Level Security activado.
- Política `"authenticated full access"`: cualquier usuario autenticado tiene acceso total (select/insert/update/delete).
- Sin sesión no se puede leer ni escribir nada (confirmado: la anon key sin login recibe error de RLS).
- Suscrita a `supabase_realtime`: cambios de otros usuarios se reflejan en vivo en la app.

## Relación con `cuentas_cobro`

Cada cuenta de cobro generada desde el drawer de un cliente guarda una copia congelada de `nombre` y `documento` en el momento de generarla (`cliente_nombre`, `cliente_documento`), no una referencia viva — así el PDF histórico no cambia si después se edita el cliente.

| Columna en `cuentas_cobro` | Origen |
|---|---|
| `cliente_id` | `clientes.id` (referencia informativa, sin FK) |
| `cliente_nombre` | copia de `clientes.nombre` al momento de generar |
| `cliente_documento` | copia de `clientes.documento` al momento de generar |

## Origen

- `supabase-schema.sql` — crea la tabla con `id, nombre, estado, proyecto, nota, updated_at`.
- `supabase-migracion-cuentas-cobro.sql` — agrega `documento`.
- UI: [src/views/clientes.js](src/views/clientes.js) — formulario de edición inline por tarjeta.
- Estado/acciones: `src/state/store.js` — lee/escribe `state.clientes`.
