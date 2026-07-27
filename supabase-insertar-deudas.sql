-- Insertar deudas de Financiamiento
-- Ejecutar en el SQL Editor de Supabase

INSERT INTO deudas (id, persona, monto, direccion, nota)
VALUES
  ('deuda-brayan-her-fotos', 'BrayanHer', 350000, 'debo', 'Fotos'),
  ('deuda-sol-servicios', 'Sol', 300000, 'debo', 'Servicios');
