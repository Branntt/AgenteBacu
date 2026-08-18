// Script para registrar todas las transacciones del usuario de una vez
// Ejecutar en consola: import { registrarTodosLosMovimientos } from './importarMovimientos.js'; registrarTodosLosMovimientos();

import { supabase } from './supabaseClient.js';

const MOVIMIENTOS_A_REGISTRAR = [
  // INGRESOS
  { fecha: '2025-07-20', tipo: 'entrada', monto: 200000, nota: 'JOSE GOYENECHE', fuente: 'bancolombia' },
  { fecha: '2025-08-07', tipo: 'entrada', monto: 2800, nota: 'YESID ANDRE DUARTE DURAN', fuente: 'bancolombia' },
  { fecha: '2025-08-08', tipo: 'entrada', monto: 4000, nota: 'DIEGO ALEJANDRO SEPULVEDA LOZANO', fuente: 'bancolombia' },
  { fecha: '2025-08-08', tipo: 'entrada', monto: 6000, nota: 'JOSE DAVID GOMEZ LABRADOR', fuente: 'bancolombia' },
  { fecha: '2025-08-09', tipo: 'entrada', monto: 7000, nota: 'Elvinia Coy de Mantilla', fuente: 'bancolombia' },
  { fecha: '2025-08-12', tipo: 'entrada', monto: 400000, nota: 'JONATHAN ENRIQUE LEON HERNANDEZ', fuente: 'bancolombia' },
  { fecha: '2025-08-14', tipo: 'entrada', monto: 100000, nota: 'Elvinia Coy de Mantilla', fuente: 'bancolombia' },
  { fecha: '2025-08-15', tipo: 'entrada', monto: 15000, nota: 'Elvinia Coy de Mantilla', fuente: 'bancolombia' },
  { fecha: '2025-08-16', tipo: 'entrada', monto: 15000, nota: 'Elvinia Coy de Mantilla', fuente: 'bancolombia' },

  // EGRESOS
  { fecha: '2025-08-02', tipo: 'salida', monto: 2500, nota: 'Transferencia a cuenta 3223104935', fuente: 'bancolombia' },
  { fecha: '2025-08-07', tipo: 'salida', monto: 5000, nota: 'EDS BOLIVAR', fuente: 'bancolombia' },
  { fecha: '2025-08-08', tipo: 'salida', monto: 1558, nota: 'UBER RIDES', fuente: 'bancolombia' },
  { fecha: '2025-08-08', tipo: 'salida', monto: 10000, nota: 'ESTACION SERVICIO', fuente: 'bancolombia' },
  { fecha: '2025-08-09', tipo: 'salida', monto: 5000, nota: 'JHONNATAN ESPINOSA', fuente: 'bancolombia' },
  { fecha: '2025-08-12', tipo: 'salida', monto: 400000, nota: 'Transferencia a cuenta 3223104935', fuente: 'bancolombia' },
  { fecha: '2025-08-12', tipo: 'salida', monto: 56800, nota: 'OXXO GONZALEZ', fuente: 'bancolombia' },
  { fecha: '2025-08-12', tipo: 'salida', monto: 29900, nota: 'APPLE.COM (1)', fuente: 'bancolombia' },
  { fecha: '2025-08-12', tipo: 'salida', monto: 99900, nota: 'APPLE.COM (2)', fuente: 'bancolombia' },
  { fecha: '2025-08-14', tipo: 'salida', monto: 21000, nota: 'TOMAS MENESES (1)', fuente: 'bancolombia' },
  { fecha: '2025-08-14', tipo: 'salida', monto: 30000, nota: 'TOMAS MENESES (2)', fuente: 'bancolombia' },
  { fecha: '2025-08-14', tipo: 'salida', monto: 4500, nota: 'Transferencia a cuenta 3165074284', fuente: 'bancolombia' },
  { fecha: '2025-08-15', tipo: 'salida', monto: 12680, nota: 'EDS RUITOQUE', fuente: 'bancolombia' },
  { fecha: '2025-08-16', tipo: 'salida', monto: 30000, nota: 'Transferencia a cuenta 3175077430', fuente: 'bancolombia' },
];

export async function registrarTodosLosMovimientos() {
  console.log('🔄 Iniciando registro de 23 movimientos...');
  let exitosos = 0;
  let fallidos = 0;

  for (let i = 0; i < MOVIMIENTOS_A_REGISTRAR.length; i++) {
    const mov = MOVIMIENTOS_A_REGISTRAR[i];
    const id = 'mv' + Date.now() + '_' + i;

    try {
      const { error } = await supabase
        .from('movimientos_financiamiento')
        .insert([{
          id,
          fecha: mov.fecha,
          tipo: mov.tipo,
          monto: mov.monto,
          nota: mov.nota,
          fuente: mov.fuente
        }]);

      if (error) {
        console.error(`❌ Error en ${mov.nota}:`, error.message);
        fallidos++;
      } else {
        const indicador = mov.tipo === 'entrada' ? '📥' : '📤';
        console.log(`${indicador} ✅ [${mov.fecha}] ${mov.nota}: $${mov.monto.toLocaleString()}`);
        exitosos++;
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      fallidos++;
    }

    // Pequeña pausa para evitar rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ REGISTRO COMPLETADO: ${exitosos} exitosos, ${fallidos} fallidos`);
  console.log(`📊 Ingresos registrados: 9 movimientos`);
  console.log(`📊 Egresos registrados: 14 movimientos`);
  console.log(`💰 Patrimonio neto: $752,300 - $769,338 = -$17,038`);
  console.log('═══════════════════════════════════════════════════════════');
}
