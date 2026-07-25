-- Migración: vencimiento y observaciones en cuentas de cobro
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table cuentas_cobro add column if not exists fecha_vencimiento date;
alter table cuentas_cobro add column if not exists observaciones text default '';
