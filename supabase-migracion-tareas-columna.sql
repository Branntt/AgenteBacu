-- Agregar campo columna a tareas para organizar tipo Kanban
ALTER TABLE tareas ADD COLUMN columna TEXT DEFAULT 'Sin fecha';

-- Comentario: valores esperados: 'Urgente', 'Hoy', 'Semana', 'Guiones', 'IA', 'METAS', 'Mejoras', 'Sin fecha'
