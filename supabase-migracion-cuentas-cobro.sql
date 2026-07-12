-- Migración: sistema de cuentas de cobro
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table clientes add column if not exists documento text default '';

create table if not exists cuentas_cobro (
  id text primary key,
  numero text not null,
  fecha date not null,
  cliente_id text,
  cliente_nombre text not null default '',
  cliente_documento text default '',
  items jsonb not null default '[]',
  total numeric not null default 0,
  created_at timestamptz default now()
);

alter table cuentas_cobro enable row level security;

create policy "authenticated full access" on cuentas_cobro
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table cuentas_cobro;
