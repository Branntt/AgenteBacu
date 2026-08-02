-- Centro de Carga (2026-08-01): campos de energía, en las DOS tablas que pueden alimentarlo —
-- metas_personales (Tecnología, Personales) y equipo_produccion (Audiovisual — Sony A6400,
-- DJI RS4, Rode, etc. NO se duplican como items nuevos en metas_personales; el usuario pidió
-- fusionar, equipo_produccion sigue siendo la única fuente para esos objetos). Mismos nombres
-- de columna en ambas tablas para que la vista Centro de Carga pueda leerlas de forma uniforme.
--
-- requiere_energia: si es true, el item aparece automáticamente en Centro de Carga — no hace
-- falta (ni existe) un paso para "agregarlo" ahí a mano, ver src/views/inventario.js.
-- tipo_energia: uno de los valores de TIPOS_ENERGIA en constants.js (texto libre a nivel de
-- columna por si se agregan tipos nuevos ahí sin otra migración).
-- carga_porcentaje: 0-100, editable a mano desde Centro de Carga (no hay forma de leer el
-- % real de una batería desde el navegador).
-- estado_carga: uno de los valores de ESTADOS_CARGA en constants.js.
-- ultima_carga: fecha (date), para la alerta de "lleva mucho tiempo sin cargarse".
alter table metas_personales add column if not exists requiere_energia boolean not null default false;
alter table metas_personales add column if not exists tipo_energia text;
alter table metas_personales add column if not exists carga_porcentaje integer;
alter table metas_personales add column if not exists estado_carga text;
alter table metas_personales add column if not exists ultima_carga date;

alter table equipo_produccion add column if not exists requiere_energia boolean not null default false;
alter table equipo_produccion add column if not exists tipo_energia text;
alter table equipo_produccion add column if not exists carga_porcentaje integer;
alter table equipo_produccion add column if not exists estado_carga text;
alter table equipo_produccion add column if not exists ultima_carga date;
