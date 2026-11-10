'use strict';

const { GRADES_BY_SEGMENT, SHIFTS } = require('../src/constants/classOptions');
const normaliseName = require('../src/utils/normaliseName');
const { SCHOOLS } = require('./20210216223701-schools');

const SEGMENT_LABEL = {
  'Educação Infantil — Creche': 'creche',
  'Educação Infantil — Pré-escola': 'pré-escola',
  'Ensino Fundamental': 'fundamental',
  'Ensino Médio': 'médio',
};

const PROFILES = new Set(['all', 'early', 'fundamental', 'later', 'sample', 'infancy-and-medium']);

function includesCurrent (profile, segment, grade) {
  if (!profile) return false;
  if (profile === 'all') return true;
  if (profile === 'early') return segment.startsWith('Educação Infantil');
  if (profile === 'fundamental') return segment === 'Ensino Fundamental';
  if (profile === 'later') {
    return segment === 'Ensino Médio' || (segment === 'Ensino Fundamental' && Number.parseInt(grade, 10) >= 6);
  }
  if (profile === 'sample') {
    return (segment === 'Educação Infantil — Creche' && grade === 'Berçário')
      || (segment === 'Educação Infantil — Pré-escola' && grade === 'Jardim I')
      || (segment === 'Ensino Fundamental' && grade === '5º ano')
      || (segment === 'Ensino Médio' && grade === '1º ano');
  }
  if (profile === 'infancy-and-medium') return segment !== 'Ensino Fundamental';
  throw new Error(`Perfil de turmas desconhecido: ${profile}`);
}

function buildClasses (schools, now = new Date()) {
  const missingLabels = Object.keys(GRADES_BY_SEGMENT).filter((segment) => !SEGMENT_LABEL[segment]);
  if (missingLabels.length) throw new Error(`Segmentos sem rótulo de turma: ${missingLabels.join(', ')}`);

  const grades = Object.entries(GRADES_BY_SEGMENT).flatMap(([segment, list]) => (
    list.map((grade) => ({ segment, grade }))
  ));
  const rows = [];

  schools.forEach((school, schoolIndex) => {
    if (school.currentProfile && !PROFILES.has(school.currentProfile)) {
      throw new Error(`Perfil de turmas desconhecido: ${school.currentProfile}`);
    }

    grades.forEach((item, gradeIndex) => {
      rows.push(classRow(school, item, schoolIndex, gradeIndex, 'completed', 'a', now));
      if (includesCurrent(school.currentProfile, item.segment, item.grade)) {
        rows.push(classRow(school, item, schoolIndex, gradeIndex, 'current', 'b', now));
      }
    });
  });

  return rows;
}

function classRow (school, item, schoolIndex, gradeIndex, status, suffix, now) {
  const baseOccupancy = {
    'Educação Infantil — Creche': item.grade === 'Berçário' ? 12 : 16,
    'Educação Infantil — Pré-escola': 20,
    'Ensino Fundamental': 24,
    'Ensino Médio': 30,
  }[item.segment];

  return {
    schoolId: school.id,
    name: normaliseName(`${SEGMENT_LABEL[item.segment]} ${item.grade} ${suffix}`),
    grade: item.grade,
    segment: item.segment,
    shift: SHIFTS[(schoolIndex + gradeIndex + (status === 'current' ? 2 : 0)) % SHIFTS.length],
    status,
    maxOccupancy: baseOccupancy + ((schoolIndex + gradeIndex + (status === 'current' ? 2 : 0)) % 6),
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  buildClasses,

  up: async (queryInterface) => {
    const [storedSchools] = await queryInterface.sequelize.query('SELECT id, name FROM schools ORDER BY id');
    const profileByName = new Map(SCHOOLS.map((school) => [normaliseName(school.name), school.currentProfile]));
    const schools = storedSchools.map((school) => {
      if (!profileByName.has(school.name)) throw new Error(`Escola sem definição de turmas: ${school.name}`);
      return { id: school.id, name: school.name, currentProfile: profileByName.get(school.name) };
    });

    await queryInterface.bulkInsert('classes', buildClasses(schools), {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('classes', null, {});
  },
};
