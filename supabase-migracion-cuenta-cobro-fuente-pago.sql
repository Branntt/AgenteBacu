-- Migración: fuente_pago en cuentas_cobro — a qué cuenta llegó el pago (bancolombia,
-- nequi o efectivo). Antes, marcar una factura pagada siempre registraba el ingreso
-- como 'bancolombia' sin importar dónde llegara la plata de verdad, así que el
-- desglose por cuenta en Financiamiento podía estar mal.
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table cuentas_cobro add column if not exists fuente_pago text default 'bancolombia';
