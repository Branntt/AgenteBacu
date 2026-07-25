-- Migración: Panorama personal (metas, objetivos mensuales por marca, tareas)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists metas_personales (
  id text primary key,
  categoria text not null default 'objeto',
  titulo text default '',
  fecha date,
  cumplida boolean default false,
  created_at timestamptz default now()
);

create table if not exists metas_mensuales (
  id text primary key,
  marca text not null,
  mes text not null,
  meta_publicaciones int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists tareas (
  id text primary key,
  texto text default '',
  color text not null default 'verde',
  hecha boolean default false,
  created_at timestamptz default now()
);

alter table metas_personales enable row level security;
alter table metas_mensuales enable row level security;
alter table tareas enable row level security;

create policy "authenticated full access" on metas_personales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on metas_mensuales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on tareas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table metas_personales;
alter publication supabase_realtime add table metas_mensuales;
alter publication supabase_realtime add table tareas;
