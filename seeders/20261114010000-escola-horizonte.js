'use strict';

const normaliseName = require('../src/utils/normaliseName');

const SCHOOL_NAME = normaliseName('Escola Horizonte');
const SECTOR_CODE = 'SA-11';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const [sectors] = await queryInterface.sequelize.query(
      'SELECT id FROM sectors WHERE code = :code',
      { replacements: { code: SECTOR_CODE } }
    );
    if (!sectors.length) throw new Error(`Setor não encontrado: ${SECTOR_CODE}`);

    await queryInterface.bulkInsert('schools', [{
      sectorId: sectors[0].id,
      name: SCHOOL_NAME,
      address: 'Rua do Horizonte, 10, Bairro Branco',
      headteacher: 'Clara Mendes',
      phone: '+5511966660030',
      createdAt: now,
      updatedAt: now,
    }]);

    const [schools] = await queryInterface.sequelize.query(
      'SELECT id FROM schools WHERE name = :name',
      { replacements: { name: SCHOOL_NAME } }
    );

    await queryInterface.bulkInsert('classes', [
      {
        schoolId: schools[0].id,
        name: normaliseName('Primavera'),
        grade: 'Jardim I',
        segment: 'Educação Infantil — Pré-escola',
        shift: 'Matutino',
        status: 'current',
        maxOccupancy: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        schoolId: schools[0].id,
        name: normaliseName('Outono'),
        grade: 'Jardim I',
        segment: 'Educação Infantil — Pré-escola',
        shift: 'Vespertino',
        status: 'completed',
        maxOccupancy: 15,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    const [schools] = await queryInterface.sequelize.query(
      'SELECT id FROM schools WHERE name = :name',
      { replacements: { name: SCHOOL_NAME } }
    );
    if (!schools.length) return;

    await queryInterface.bulkDelete('classes', { schoolId: schools[0].id });
    await queryInterface.bulkDelete('schools', { id: schools[0].id });
  },
};
