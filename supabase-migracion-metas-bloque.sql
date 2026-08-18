-- Migración: bloque del día en los hábitos (mañana / día / noche).
--
-- La app agrupa los hábitos por bloque desde el rediseño de Bienestar, y al sembrarlos
-- manda ese campo. Sin esta columna el insert falla entero: salta el aviso rojo de "no se
-- pudo guardar" en cada carga y los hábitos nunca llegan a quedar guardados.
--
-- Es idempotente: se puede correr de nuevo sin romper nada.
-- Ejecutar completo en el SQL Editor de Supabase.

alter table metas_personales add column if not exists bloque text;
