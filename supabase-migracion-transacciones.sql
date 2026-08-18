-- Migración: Transacciones de ingresos y gastos diarios
-- Tabla para tracking de transacciones en tiempo real
-- Categorización automática basada en descripción
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

create table if not exists transacciones (
  id text primary key,
  fecha date not null,
  descripcion text default '',
  monto numeric(12,2) not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  categoria text default 'otros',
  fuente text not null check (fuente in ('nequi', 'bancolombia', 'efectivo')),
  created_at timestamptz default now()
);

alter table transacciones enable row level security;

create policy "authenticated full access" on transacciones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table transacciones;
