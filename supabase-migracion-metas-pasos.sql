-- Migración: pasos del plan de una meta (checklist simple: texto + hecho), en
-- metas_personales — para que una meta se alcance con pasos marcables, no un
-- solo check de golpe.
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table metas_personales add column if not exists pasos jsonb not null default '[]';
