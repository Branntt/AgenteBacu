-- Migración: pestaña Financiamiento (movimientos manuales de Bancolombia/Nequi/efectivo)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists movimientos_financiamiento (
  id text primary key,
  fecha date not null,
  fuente text not null default 'bancolombia',
  tipo text not null default 'ingreso',
  monto numeric not null default 0,
  nota text default '',
  created_at timestamptz default now()
);

alter table movimientos_financiamiento enable row level security;

create policy "authenticated full access" on movimientos_financiamiento
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table movimientos_financiamiento;
