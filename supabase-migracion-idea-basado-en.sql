-- Migración: enlazar una idea (Fotos/Carrusel/Post) a una Estrategia (idea padre) —
-- basado_en_id guarda el id de otra fila de ideas; null = contenido independiente ("Aparte").
-- No es una foreign key real (mismo criterio que cuentas_cobro.cliente_id): el id es texto libre.
-- Ejecutar en el SQL Editor de Supabase.

alter table ideas add column if not exists basado_en_id text;
