-- Migración: Equipo de producción (cámaras, luces, audio, soporte del estudio),
-- dentro de la pestaña Inventario. Tabla propia, separada de metas_personales,
-- porque acá lo que importa es "¿quién lo tiene ahora?" (prestado_a), no
-- "¿es mío?" como en el resto de Inventario (personal/habitación/garaje).
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists equipo_produccion (
  id text primary key,
  nombre text default '',
  categoria text default 'otro',
  prestado_a text default '',
  created_at timestamptz default now()
);

alter table equipo_produccion enable row level security;

create policy "authenticated full access" on equipo_produccion
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table equipo_produccion;
