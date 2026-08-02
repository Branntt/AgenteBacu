// Datos de la carrera de Brandon — Artes Audiovisuales (UNAB).
// Info actualizada desde MiPortal (matricula actual).
// Es una foto del cumplimiento curricular; se actualiza a mano cuando el portal cambie.

export const UNIVERSIDAD = {
  programa: 'Artes Audiovisuales',
  id: 'U00168667',
  creditosAprobados: 109,
  creditosRequeridos: 127,
  evaluado: '2026-08-02',
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
      nombre: '7 semestre', aprob: 3, req: 3, estado: 'ok',
      cursos: [{ curso: 'Gestión Audiovisual', creditos: 3, estado: 'ok', matriculado: true }]
    },
    {
      nombre: '8 semestre', aprob: 5, req: 15, estado: 'pend',
      cursos: [
        { curso: 'Práctica Profesional', creditos: 10, estado: 'pend' },
        { curso: 'Electivas Ciclo Común', creditos: 5, estado: 'ok', matriculado: true }
      ]
    },
    {
      nombre: 'Curso Sociohumanístico', aprob: 6, req: 6, estado: 'ok',
      cursos: [
        { curso: 'Sociohumanístico 3 semestre', creditos: 3, materia: 'Luces, cámara, historia', nota: '3.3', estado: 'ok' },
        { curso: 'Sociohumanístico 4 semestre', creditos: 3, materia: 'Electiva Sociohumanística', estado: 'ok', matriculado: true }
      ]
    },
    {
      nombre: 'Electivas de Profundización', aprob: 12, req: 12, estado: 'ok',
      cursos: [
        { curso: 'Electiva Profundiza 1 semestre', creditos: 3, materia: 'Fundamentos de Diseño', nota: '3.1', estado: 'ok' },
        { curso: 'Electiva Profundiza 2 semestre', creditos: 3, materia: 'Semiótica de la Imagen', nota: '3.5', estado: 'ok' },
        { curso: 'Electiva Profundiza 4 semestre', creditos: 3, materia: 'Teoría Estética', nota: '3.9', estado: 'ok' },
        { curso: 'Electiva Profundiza 5 semestre', creditos: 3, materia: 'Fenomenología de la Imagen', nota: '3.3', estado: 'ok' }
      ]
    },
    {
      nombre: 'Electiva de Contexto', aprob: 3, req: 6, estado: 'pend',
      cursos: [
        { curso: 'Electiva de Contexto 7 semestre', creditos: 3, materia: 'Finanzas para decisiones perso.', nota: '3.8', estado: 'ok', matriculado: true },
        { curso: 'Electiva de Contexto 8 semestre', creditos: 3, estado: 'pend' }
      ]
    },
    {
      nombre: 'Bienestar Universitario', aprob: 2, req: 2, estado: 'ok',
      cursos: [
        { curso: 'Taller de Desarrollo Humano', creditos: 1, materia: 'Taller salud masaje terapéutico', nota: 'A', estado: 'ok' },
        { curso: 'Taller Deporte, Recreación y Cultura', creditos: 1, materia: 'Taller deporte billar', nota: 'A', estado: 'ok' }
      ]
    },
    {
      nombre: 'Competencias Digitales', aprob: 5, req: 5, estado: 'ok',
      cursos: [
        { curso: 'Vida en Línea', materia: 'Examen Vida en Línea', estado: 'ok' },
        { curso: 'Cultura Digital', materia: 'Examen Cultura Digital', estado: 'ok' },
        { curso: 'MS Word', estado: 'ok', matriculado: true },
        { curso: 'MS Excel', estado: 'ok', matriculado: true },
        { curso: 'MS PowerPoint', estado: 'ok', matriculado: true }
      ]
    },
    {
      nombre: 'Instrumental Idiomas', aprob: 7, req: 7, estado: 'ok',
      cursos: [
        { curso: 'A1 Basic Breakthrough', nota: 'A', estado: 'ok' },
        { curso: 'A2-1 Waystage 1', nota: 'A', estado: 'ok' },
        { curso: 'Prueba de Suficiencia en Inglés', estado: 'ok' }
      ]
    }
  ],

  // Matrícula actual (202660) — segundo semestre 2026
  matriculaActual: {
    periodo: '202660',
    creditosMatriculados: 28,
    cursos: [
      { curso: 'MS Word', nrc: '', sem: 2, creditos: 0, estado: 'matriculado' },
      { curso: 'MS Excel', nrc: '', sem: 3, creditos: 0, estado: 'matriculado' },
      { curso: 'Electiva Sociohumanística', nrc: '', sem: 4, creditos: 3, estado: 'matriculado' },
      { curso: 'MS PowerPoint', nrc: '', sem: 4, creditos: 0, estado: 'matriculado' },
      { curso: 'Electiva de Contexto', nrc: '', sem: 7, creditos: 3, estado: 'matriculado' },
      { curso: 'Electivas Ciclo Común', nrc: '', sem: 7, creditos: 11, estado: 'matriculado' },
      { curso: 'Gestión Audiovisual', nrc: '', sem: 7, creditos: 3, estado: 'matriculado' },
      { curso: 'Electivas Ciclo Común', nrc: '', sem: 8, creditos: 5, estado: 'matriculado' }
    ]
  },

  // Cursos que faltan por matricular
  cursosPendientes: [
    { curso: 'Práctica Profesional', sem: 8, creditos: 10, razon: 'Trabajo de grado - 8 semestre' },
    { curso: 'Electiva de Contexto', sem: 8, creditos: 3, razon: 'Completar contexto' },
    { curso: 'Realización Proyecto Documental', sem: 7, creditos: 5, razon: 'Trabajo de grado - 7 semestre' }
  ],

  // Trabajos asignados por profesores
  trabajosAsignados: []
};
