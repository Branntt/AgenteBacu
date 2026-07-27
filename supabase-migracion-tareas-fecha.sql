-- Migración: fecha de entrega opcional en tareas (se refleja en el Calendario)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table tareas add column if not exists fecha date;
