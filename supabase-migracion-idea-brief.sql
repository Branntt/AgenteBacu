-- Migración: el brief de una idea — para quién es, en qué consiste, cómo se graba y qué se
-- espera de ella. Son las cuatro preguntas que el usuario quiere responder al anotarla.
--
-- La app funciona sin correr esto: si estas columnas no existen, la idea se guarda igual
-- (sin el brief) y las respuestas quedan en el navegador, para no perder nada. Correrlo es
-- lo que hace que el brief viaje entre dispositivos.
--
-- Es idempotente: se puede correr de nuevo sin romper nada.

alter table ideas add column if not exists cliente text;
alter table ideas add column if not exists consiste text;
alter table ideas add column if not exists como_grabar text;
alter table ideas add column if not exists que_espero text;
