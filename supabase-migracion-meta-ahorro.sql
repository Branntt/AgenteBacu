-- Migración: monto objetivo/ahorrado en metas_personales — permite trackear ahorro real en
-- pesos hacia una meta con nombre y fecha (ej. "iPhone 17 Pro Max — $4.000.000"), separado del
-- progreso por pasos que ya existía (checklist, no monetario). Ambos pueden convivir en la
-- misma meta; el progreso en $ solo se muestra si se llena monto_objetivo.
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table metas_personales add column if not exists monto_objetivo numeric;
alter table metas_personales add column if not exists monto_ahorrado numeric default 0;
