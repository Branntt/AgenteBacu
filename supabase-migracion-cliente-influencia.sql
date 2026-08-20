-- Migración: influencia de un cliente (1 a 99) — el único atributo de su carta que no se
-- puede deducir de los datos: cuánto te abre puertas trabajar con él. Lo pone el usuario.
--
-- La app funciona sin correr esto: si la columna no existe, la influencia queda en 50 y el
-- resto de la carta se calcula igual.

alter table clientes add column if not exists influencia integer;
