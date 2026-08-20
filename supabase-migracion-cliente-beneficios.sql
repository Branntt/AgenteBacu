-- Migración: en qué te beneficia cada cliente — dinero, puertas, portafolio, aprendizaje,
-- constancia y trato, de 1 a 99. Es un juicio del usuario, no un cálculo: un cliente que
-- paga poco pero te abre puertas no vale lo mismo que uno que paga bien y te desgasta.
--
-- Van los seis juntos en un solo campo, así una columna alcanza para todos y para los que
-- se agreguen después.
--
-- La app funciona sin correr esto: los valores quedan guardados en el navegador y la carta
-- se ve igual. Correrlo es lo que hace que viajen entre dispositivos.

alter table clientes add column if not exists beneficios jsonb;
