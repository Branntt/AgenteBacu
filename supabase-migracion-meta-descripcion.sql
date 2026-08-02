-- Agregar campo descripcion a metas_personales
-- Permite guardar el contexto de coste-beneficio, ej: "8 horas de trabajo = comprar una luz"

ALTER TABLE metas_personales ADD COLUMN descripcion TEXT;
