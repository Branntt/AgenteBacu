# Ejecutar Migración: Campo `descripcion` en Metas

## URL Directa
https://app.supabase.com/project/ndxyflcscxbgpelpvrtb/sql/new

## Pasos:
1. Abre la URL arriba en tu navegador
2. Asegúrate de estar logueado en Supabase
3. Ve a **SQL Editor** → **New Query**
4. Copia y pega el SQL abajo
5. Click en **Run** (▶️)

## SQL a ejecutar:

```sql
-- Agregar campo descripcion a metas_personales
-- Permite guardar el contexto de coste-beneficio, ej: "8 horas de trabajo = comprar una luz"

ALTER TABLE metas_personales ADD COLUMN descripcion TEXT;
```

## Listo ✅
Una vez ejecutado, el campo `descripcion` estará disponible en todas las metas.
