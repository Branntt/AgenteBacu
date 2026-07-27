-- Migración: Gastos Mensuales (tracking de pagos de gastos recurrentes)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists gastos_mensuales (
  id text primary key,
  concepto text not null,
  monto numeric not null default 0,
  dia_vencimiento integer not null default 1,
  pagada boolean default false,
  mes_ano text not null,
  created_at timestamptz default now()
);

alter table gastos_mensuales enable row level security;

create policy "authenticated full access" on gastos_mensuales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table gastos_mensuales;
