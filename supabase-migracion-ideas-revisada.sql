-- Migración: Agregar campo 'revisada' a tabla ideas para rastrear ideas revisadas por fecha
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

alter table ideas add column if not exists revisada boolean default false;

-- Actualizar ideas existentes como revisadas (asumiendo que todas las antiguas ya fueron revisadas)
update ideas set revisada = true where revisada is null;
