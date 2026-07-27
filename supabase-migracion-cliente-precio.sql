-- Migración: agregar precio a clientes
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio numeric default 0;
