-- Migración: ultimo_pago en pagos_mensuales — la última fecha en que se marcó
-- pagado ese pago/suscripción. No es una fila por mes: financiamiento.js compara
-- el prefijo YYYY-MM contra hoy para saber si ya salió este mes o sigue pendiente.
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table pagos_mensuales add column if not exists ultimo_pago date;
