-- Agrega `tipo` a metas_personales: sub-categoría de los objetos de Inventario > Personal
-- (camisa, pantalon, buzo, zapatos, medias, gorra, gafas, audifonos, aretes, piercing_ceja,
-- otro — ver TIPOS_PERSONAL en src/data/constants.js). Sin esto, los items siguen
-- funcionando igual (caen en "Otro" por defecto en la app), solo que el selector de
-- categoría no tiene dónde guardarse (banner de error al cambiarlo).
alter table metas_personales add column if not exists tipo text;

-- Reclasifica los 2 objetos ya sembrados que tienen una categoría obvia — el resto
-- ("Bandana / cubrecuello", "Mochila") se queda en "Otro" hasta que se reclasifiquen a mano
-- desde la app, porque no hay un tipo claro para ellos en la lista de arriba.
update metas_personales set tipo = 'gorra' where categoria = 'inv_personal' and titulo = 'Gorra negra' and tipo is null;
update metas_personales set tipo = 'gafas' where categoria = 'inv_personal' and titulo = 'Lentes de sol' and tipo is null;
