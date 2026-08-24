-- Migración: habilitar la sincronización completa de las tareas de Universidad.
--
-- Un trabajo de la U es una tarea (tabla `tareas`) con tres campos extra: `columna`
-- ('Universidad'), `fecha` (entrega, se refleja en el Calendario) y `materia`. Si esas
-- columnas no existen en Supabase, el trabajo de la U falla al guardarse en la nube y queda
-- solo en el dispositivo donde se creó — por eso no se ve igual en el celular y el computador.
--
-- Este bloque junta las tres columnas en una sola migración idempotente: se puede correr
-- (y volver a correr) sin romper nada. Ejecutar COMPLETO una vez en el SQL Editor de Supabase.

alter table tareas add column if not exists columna text default 'Sin fecha';
alter table tareas add column if not exists fecha   date;
alter table tareas add column if not exists materia text;
