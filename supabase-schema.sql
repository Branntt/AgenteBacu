-- Sistema Editorial (S.A.O BACU) — esquema inicial para Supabase
-- Ejecutar completo en el SQL Editor de Supabase.

create table if not exists ideas (
  id text primary key,
  marca text not null default 'brant',
  colab text default '',
  titulo text default '',
  nota text default '',
  gancho text default '',
  objetivos jsonb default '[]',
  formato text default 'Reel',
  estado text default 'desarrollo',
  fecha date,
  fecha_rodaje date,
  preguntas jsonb default '[null,null,null,null]',
  tiempo text default '',
  grabacion boolean default false,
  edicion boolean default false,
  prioridad text default 'Media',
  etapa int default 0,
  metricas jsonb,
  aprendizaje text,
  guion jsonb,
  updated_at timestamptz default now()
);

create table if not exists clientes (
  id text primary key,
  nombre text default '',
  estado text default 'prospecto',
  proyecto text default '',
  nota text default '',
  updated_at timestamptz default now()
);

create table if not exists snaps (
  id text primary key,
  fecha date not null,
  brant jsonb,
  bacu jsonb,
  novena jsonb,
  updated_at timestamptz default now()
);

alter table ideas enable row level security;
alter table clientes enable row level security;
alter table snaps enable row level security;

create policy "authenticated full access" on ideas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on clientes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on snaps
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table ideas;
alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table snaps;
