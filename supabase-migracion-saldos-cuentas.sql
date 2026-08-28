-- Migración: saldo real por cuenta (Bancolombia / Nequi / Efectivo)
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).
--
-- Por qué existe: antes el saldo de cada cuenta se calculaba sumando TODAS las transacciones
-- desde siempre, sin ningún punto de partida real — si algo se registró mal en el camino (o
-- nunca se registró un saldo inicial), el número en pantalla dejaba de significar nada.
--
-- Cómo funciona ahora: esta tabla guarda el saldo REAL de cada cuenta a la fecha en que lo
-- declaraste (fecha_corte). calcularFinanciamiento() ya no sea desde cero: arranca de este
-- número y solo le suma/resta lo que pase DESPUÉS de fecha_corte. Todo lo anterior no
-- desaparece — se puede seguir viendo en el Historial — pero deja de ensuciar el saldo en vivo.

create table if not exists saldos_cuentas (
  fuente text primary key check (fuente in ('bancolombia', 'nequi', 'efectivo')),
  monto numeric(12,2) not null default 0,
  fecha_corte date not null default current_date,
  actualizado_en timestamptz default now()
);

alter table saldos_cuentas enable row level security;

create policy "authenticated full access" on saldos_cuentas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table saldos_cuentas;

-- Siembra tu saldo real de HOY (fecha_corte = el día en que corras esto). A partir de acá,
-- Efectivo arranca en $150.000 y Bancolombia/Nequi en $0 — la verdad, no lo acumulado.
insert into saldos_cuentas (fuente, monto, fecha_corte, actualizado_en) values
  ('efectivo', 150000, current_date, now()),
  ('bancolombia', 0, current_date, now()),
  ('nequi', 0, current_date, now())
on conflict (fuente) do update set
  monto = excluded.monto,
  fecha_corte = excluded.fecha_corte,
  actualizado_en = excluded.actualizado_en;
