-- Migración: pendientes de Universidad (tareas de clase, con materia o profesor).
--
-- Reutiliza la tabla `tareas` que ya existe: un pendiente de universidad es una tarea con
-- columna = 'Universidad'. Lo único que falta es dónde guardar la materia o el profesor.
-- Pared solo muestra sus columnas fijas, así que estos pendientes no aparecen allá.
--
-- Es idempotente: se puede correr de nuevo sin romper nada.
-- Ejecutar completo en el SQL Editor de Supabase.

alter table tareas add column if not exists materia text;
