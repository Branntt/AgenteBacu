-- Migración: urgente (bool) en deudas — etiqueta manual, independiente de fecha
-- o monto, para que el usuario marque qué deuda le pesa más (ej. Edinson $600k
-- urgente aunque otra deuda sea más vieja). Se usa para ordenar "Debes Pagar".
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table deudas add column if not exists urgente boolean not null default false;
