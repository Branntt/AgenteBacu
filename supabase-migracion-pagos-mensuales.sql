-- Migración: pagos mensuales / suscripciones recurrentes, dentro de Financiamiento
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists pagos_mensuales (
  id text primary key,
  nombre text default '',
  monto numeric not null default 0,
  dia_pago int,
  created_at timestamptz default now()
);

alter table pagos_mensuales enable row level security;

create policy "authenticated full access" on pagos_mensuales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table pagos_mensuales;
