-- Siembra: pagos fijos mensuales (suscripciones)
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Los montos son reales; el día de pago (dia_pago) queda en blanco a propósito — se completa
-- directo en la pestaña Finanzas > Fijos, en el campo "Día" de cada tarjeta. Sin ese día, el
-- recordatorio de "pago próximo" no puede avisarte antes de que venza (solo funciona con
-- dia_pago puesto), así que vale la pena completarlo ni bien puedas.

insert into pagos_mensuales (id, nombre, monto, dia_pago) values
  ('pm-claude', 'Claude', 100000, null),
  ('pm-lightroom', 'Lightroom', 8000, null),
  ('pm-datos', 'Datos (plan móvil)', 50000, null),
  ('pm-capcut', 'CapCut', 30000, null)
on conflict (id) do update set
  nombre = excluded.nombre,
  monto = excluded.monto;
