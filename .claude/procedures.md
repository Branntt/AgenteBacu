# Procedimientos Automatizados (Skills)

## 1. Ejecutar Query SQL en Supabase

**Cuándo usarla:** Cuando necesites ejecutar migraciones o queries en Supabase.

**Cómo pedirla:**
```
"Abre Supabase y ejecuta: [nombre corto de la query]"
```

**Ejemplo:**
```
"Abre Supabase y ejecuta: Limpiar duplicados de metas_personales"
```

**Qué hace el asistente automáticamente:**
1. ✅ Navega a Supabase SQL Editor
2. ✅ Escribe el SQL exacto
3. ✅ Pone un nombre descriptivo a la query
4. ✅ **Deja TODO listo**

**Lo único que tienes que hacer:**
- 🖱️ **Click en RUN** (▶️ botón azul arriba a la derecha)

---

## 2. Abrir URL en tu Navegador

**Cuándo usarla:** Para abrir cualquier sitio web.

**Cómo pedirla:**
```
"Abre [URL] en mi navegador"
```

**Ejemplo:**
```
"Abre https://app.supabase.com en mi navegador"
```

**Qué hace:** Abre la URL en tu Chrome real (no en Claude Code).

---

## Queries Disponibles

Aquí van las queries que se pueden ejecutar automáticamente:

### Limpiar duplicados de metas_personales
```sql
DELETE FROM metas_personales
WHERE id NOT IN (
  SELECT MIN(id)
  FROM metas_personales
  WHERE categoria IN (
    'camara', 'luces', 'edicion', 'perifericos',
    'deseo_vehiculo', 'deseo_camara', 'deseo_otros',
    'personal', 'destreza',
    'logro_equipo', 'logro_hito', 'logro'
  )
  GROUP BY titulo, categoria
)
AND categoria IN (
  'camara', 'luces', 'edicion', 'perifericos',
  'deseo_vehiculo', 'deseo_camara', 'deseo_otros',
  'personal', 'destreza',
  'logro_equipo', 'logro_hito', 'logro'
);
```

---

## Cómo Agregar Más Queries

Si necesitas una nueva query:
1. Descríbela al asistente
2. Él la escribe, la nombra, y deja TODO listo
3. Tú solo das Run

El asistente siempre:
- Navega a Supabase
- Prepara el SQL
- Pone nombre descriptivo
- **Nunca ejecuta automáticamente** (siempre espera tu confirmación en Run)
