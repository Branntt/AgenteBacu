-- Migración: estado de pago por cuenta de cobro individual
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).
--
-- Antes, "Te deben" se calculaba mirando el estado general del cliente (por_pagar / ya_pagos),
-- lo que sumaba mal cuando un cliente recurrente tenía facturas viejas ya pagadas y una nueva
-- sin pagar. Ahora cada cuenta de cobro sabe por sí misma si está pagada.

alter table cuentas_cobro add column if not exists pagada boolean not null default false;
