-- Migración: fecha de grabación por cliente (se refleja en el Calendario)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table clientes add column if not exists fecha_grabacion date;
