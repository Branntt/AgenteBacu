// Datos de la carrera de Brandon — Artes Audiovisuales (UNAB).
// Info de un momento específico (evaluada 05/06/2026, solicitud 10, periodo Segundo Semestre 2026).
// Es una foto del cumplimiento curricular; se actualiza a mano cuando el portal cambie.

export const UNIVERSIDAD = {
  programa: 'Artes Audiovisuales',
  id: 'U00168667',
  creditosAprobados: 109,
  creditosRequeridos: 147,
  evaluado: '2026-06-05',
  periodo: 'Segundo Semestre 2026',

  // Bloques del cumplimiento curricular. estado: 'ok' | 'pend'
  bloques: [
    { nombre: '1 semestre', aprob: 15, req: 15, estado: 'ok' },
    { nombre: '2 semestre', aprob: 15, req: 15, estado: 'ok' },
    { nombre: '3 semestre', aprob: 15, req: 15, estado: 'ok' },
    { nombre: '4 semestre', aprob: 12, req: 12, estado: 'ok' },
    { nombre: '5 semestre', aprob: 15, req: 15, estado: 'ok' },
    { nombre: '6 semestre', aprob: 18, req: 18, estado: 'ok' },
    {
      nombre: '7 semestre', aprob: 0, req: 3, estado: 'pend',
      cursos: [{ curso: 'Gestión Audiovisual', creditos: 3, estado: 'pend' }]
    },
    {
      nombre: '8 semestre', aprob: 0, req: 10, estado: 'pend',
      cursos: [{ curso: 'Práctica Profesional', creditos: 10, estado: 'pend' }]
    },
    {
      nombre: 'Curso Sociohumanístico', aprob: 3, req: 6, estado: 'pend',
      cursos: [
        { curso: 'Sociohumanístico 3 semestre', creditos: 3, materia: 'Luces, cámara, historia', nota: '3.3', estado: 'ok' },
        { curso: 'Sociohumanístico 4 semestre', creditos: 3, estado: 'pend' }
      ]
    },
    {
      nombre: 'Electivas de Profundización', aprob: 12, req: 28, estado: 'pend',
      cursos: [
        { curso: 'Electiva Profundiza 1 semestre', creditos: 3, materia: 'Fundamentos de Diseño', nota: '3.1', estado: 'ok' },
        { curso: 'Electiva Profundiza 2 semestre', creditos: 3, materia: 'Semiótica de la Imagen', nota: '3.5', estado: 'ok' },
        { curso: 'Electiva Profundiza 4 semestre', creditos: 3, materia: 'Teoría Estética', nota: '3.9', estado: 'ok' },
        { curso: 'Electiva Profundiza 5 semestre', creditos: 3, materia: 'Fenomenología de la Imagen', nota: '3.3', estado: 'ok' },
        { curso: 'Electiva Profundiza 7 semestre', creditos: 11, estado: 'pend' },
        { curso: 'Electiva Profundiza 8 semestre', creditos: 5, estado: 'pend' }
      ]
    },
    {
      nombre: 'Electiva de Contexto', aprob: 2, req: 6, estado: 'pend',
      cursos: [
        { curso: 'Electiva de Contexto 7 semestre', creditos: 3, materia: 'Finanzas para decisiones perso.', nota: '3.8', estado: 'parcial', aprob: 2 },
        { curso: 'Electiva de Contexto 8 semestre', creditos: 3, estado: 'pend' }
      ]
    },
    {
      nombre: 'Bienestar Universitario', aprob: 2, req: 4, estado: 'pend',
      cursos: [
        { curso: 'Taller de Desarrollo Humano', creditos: 1, materia: 'Taller salud masaje terapéutico', nota: 'A', estado: 'ok' },
        { curso: 'Taller Deporte, Recreación y Cultura', creditos: 1, materia: 'Taller deporte billar', nota: 'A', estado: 'ok' },
        { curso: 'Actividades Libres', creditos: 2, materia: '48 horas libres acumuladas', estado: 'pend' }
      ]
    },
    {
      nombre: 'Competencias Digitales', aprob: 2, req: 5, estado: 'pend',
      cursos: [
        { curso: 'Vida en Línea', materia: 'Examen Vida en Línea', estado: 'ok' },
        { curso: 'Cultura Digital', materia: 'Examen Cultura Digital', estado: 'ok' },
        { curso: 'MS Word', estado: 'pend' },
        { curso: 'MS Excel', estado: 'pend' },
        { curso: 'MS PowerPoint', estado: 'pend' }
      ]
    },
    {
      nombre: 'Instrumental Idiomas', aprob: 2, req: 7, estado: 'pend',
      cursos: [
        { curso: 'A1 Basic Breakthrough', nota: 'A', estado: 'ok' },
        { curso: 'A2-1 Waystage 1', nota: 'A', estado: 'ok' },
        { curso: 'A2-2 Waystage 2', estado: 'pend' },
        { curso: 'B1-1 Threshold 1', estado: 'pend' },
        { curso: 'B1-2 Threshold 2', estado: 'pend' },
        { curso: 'B2-1 Vantage 1', estado: 'pend' },
        { curso: 'B2-2 Vantage 2', estado: 'pend' }
      ]
    }
  ],

  // Matrícula recomendada para el próximo periodo (202660)
  matriculaRecomendada: {
    periodo: '202660',
    creditosRequeridos: 25,
    creditosAMatricular: 16,
    cursos: [
      { curso: 'Marca Personal Digital', nrc: '63588', sem: 2, creditos: 2 },
      { curso: 'IA Generativa', nrc: '63597', sem: 3, creditos: 0 },
      { curso: 'Creación de Contenido Digital', nrc: '64207', sem: 4, creditos: 2 },
      { curso: 'Comprender el Contexto', nrc: '59495', sem: 7, creditos: 2 },
      { curso: 'Formas del Documental', nrc: '61842', sem: 7, creditos: 2 },
      { curso: 'Diseño Proy Grado Documental', nrc: '61839', sem: 7, creditos: 5 },
      { curso: 'Gestión Audiovisual', nrc: '61843', sem: 7, creditos: 3 }
    ]
  }
};
