-- Permite anidar items dentro de otros en metas_personales (ej. "Computador de Mesa" con sus
-- piezas adentro, o "Cartera" con cédula/licencia/tarjetas adentro). Un solo nivel: un item
-- con parent_id null es de primer nivel; un item con parent_id apunta a su padre directo, no
-- hay hijos-de-hijos. Sin FK real (mismo criterio que basado_en_id en ideas) — si el padre se
-- borra, los hijos quedan huérfanos (parent_id apuntando a un id que ya no existe) y la app
-- simplemente no los muestra anidados; no hay ON DELETE CASCADE a propósito, para no borrar
-- datos del usuario sin que él lo pida explícitamente.
alter table metas_personales add column if not exists parent_id text;
