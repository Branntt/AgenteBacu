-- Migración: deudas y cuentas por cobrar, dentro de Financiamiento
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists deudas (
  id text primary key,
  persona text default '',
  monto numeric not null default 0,
  direccion text not null default 'debo',
  nota text default '',
  pagada boolean default false,
  created_at timestamptz default now()
);

alter table deudas enable row level security;

create policy "authenticated full access" on deudas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table deudas;
