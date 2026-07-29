-- Migración: fecha límite opcional en deudas (pesa en el medidor de estrés de Bienestar
-- si ya se venció y sigue sin pagar).
-- Ejecutar completo en el SQL Editor de Supabase (una sola vez).

alter table deudas add column if not exists fecha_limite date;
