/**
 * Gmail Monitor - Lee correos y detecta gastos automáticamente
 * Busca patrones como:
 * - "Factura", "Invoice", "Recibo"
 * - Montos ($XXX, USD XXX, etc)
 * - Remitentes comunes (servicios, tiendas)
 */

import { supabase } from './supabaseClient.js';

// Palabras clave para detectar tipos de gastos
const EXPENSE_PATTERNS = {
  servicios: ['electricidad', 'agua', 'internet', 'teléfono', 'gas', 'servicio', 'factura de servicios'],
  transporte: ['uber', 'didi', 'transporte', 'pasaje', 'metro', 'gasolina', 'carburante'],
  comida: ['uber eats', 'rappi', 'restaurant', 'comida', 'almuerzo', 'cena', 'desayuno', 'pizzería'],
  suscripciones: ['netflix', 'spotify', 'prime', 'suscripción', 'membership', 'plan'],
  salud: ['farmacia', 'médico', 'doctor', 'hospital', 'medicina', 'salud'],
  compras: ['amazon', 'mercado libre', 'tienda', 'compra', 'producto'],
};

/**
 * Detecta la categoría de un gasto basado en el remitente y contenido
 */
export function detectarCategoriaDeCorreo(from, subject, body) {
  const texto = `${from} ${subject} ${body}`.toLowerCase();

  for (const [categoria, palabras] of Object.entries(EXPENSE_PATTERNS)) {
    if (palabras.some(palabra => texto.includes(palabra))) {
      return categoria;
    }
  }

  return 'otro';
}

/**
 * Extrae montos en formato $XXX.XXX o USD XXX del texto
 */
export function extraerMonto(texto) {
  // Busca patrones como $1.234.567 o USD 1234.56 o $1,234.56
  const patterns = [
    /\$[\s]*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/gi,
    /USD[\s]*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/gi,
    /COP[\s]*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/gi,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      // Extrae solo los dígitos y punto decimal
      const monto = match[0].replace(/[^\d.,-]/g, '');
      // Normaliza: convierte , en . y elimina puntos de miles
      let normalizado = monto.replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(normalizado);
      if (valor > 0) return valor;
    }
  }

  return null;
}

// Detecta cuál de las 3 fuentes válidas de la tabla (constraint fuente in ('nequi',
// 'bancolombia', 'efectivo')) corresponde, buscando el nombre del banco en el propio correo.
// Heurística mínima a propósito — se afina cuando se conecte esto con correos reales.
function detectarFuente(from, subject, body) {
  const texto = `${from} ${subject} ${body}`.toLowerCase();
  if (texto.includes('bancolombia')) return 'bancolombia';
  if (texto.includes('nequi')) return 'nequi';
  return 'efectivo';
}

/**
 * Procesa un correo y crea un gasto si lo detecta
 * Retorna {creado: boolean, gasto: object | null, razon: string}
 */
export async function procesarCorreoGmail(mensaje) {
  try {
    const from = mensaje.from || '';
    const subject = mensaje.subject || '';
    const body = mensaje.body || '';
    const fecha = new Date(mensaje.internalDate).toISOString().split('T')[0];

    // Busca palabras clave de factura/gasto
    const esGasto = /factura|invoice|recibo|pago|transacción|cargo|compra|suscripción/i.test(
      `${subject} ${body}`
    );

    if (!esGasto) {
      return { creado: false, razon: 'No es un gasto detectado' };
    }

    const monto = extraerMonto(`${subject} ${body}`);
    if (!monto) {
      return { creado: false, razon: 'No se encontró monto' };
    }

    const categoria = detectarCategoriaDeCorreo(from, subject, body);
    const fuente = detectarFuente(from, subject, body);

    // Extrae descripción del asunto
    let descripcion = subject;
    if (descripcion.length > 100) {
      descripcion = descripcion.substring(0, 100);
    }

    // Verifica si ya existe un gasto similar (mismo monto, misma fecha, misma categoría).
    // La tabla transacciones no tiene columna usuario_id (supabase-migracion-transacciones.sql)
    // — antes esto filtraba por una columna inexistente y la consulta fallaba siempre.
    const { data: existentes } = await supabase
      .from('transacciones')
      .select('id')
      .eq('fecha', fecha)
      .eq('monto', monto)
      .eq('tipo', 'gasto')
      .limit(1);

    if (existentes && existentes.length > 0) {
      return { creado: false, razon: 'Gasto duplicado' };
    }

    // Crea el gasto en Supabase
    const { data: nuevoGasto, error } = await supabase
      .from('transacciones')
      .insert([
        {
          fecha,
          tipo: 'gasto',
          descripcion,
          monto,
          categoria,
          fuente,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { creado: false, razon: `Error: ${error.message}` };
    }

    return {
      creado: true,
      gasto: nuevoGasto,
      razon: `Gasto registrado: ${categoria} - $${monto}`,
    };
  } catch (error) {
    return { creado: false, razon: `Excepción: ${error.message}` };
  }
}

/**
 * Monitorea Gmail y procesa correos no leídos
 * Retorna array de resultados de procesamiento
 *
 * TODO (sin terminar): esto sigue siendo un placeholder — no busca ni trae correos todavía,
 * solo devuelve un resultado vacío. Para conectarlo de verdad hace falta: traer los mensajes
 * de Gmail (API o conector), llamar a procesarCorreoGmail(mensaje) por cada uno, y acumular
 * los resultados acá. usuarioId ya no aplica (transacciones no tiene esa columna, ver
 * procesarCorreoGmail arriba) — queda solo por si gmailTokens lo necesita para autenticar.
 */
export async function monitorearGmail(usuarioId, gmailTokens) {
  // Por ahora retorna estructura de placeholder
  return {
    exitosos: 0,
    errores: 0,
    detalles: [],
    timestamp: new Date().toISOString(),
  };
}
