/* eslint-disable quotes */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const schools = await queryInterface.sequelize.query(
      `SELECT * FROM schools WHERE name = 'escola estadual municipalizada polivalente anísio teixeira';`
    );

    const schoolId = schools[0][0].id;

    await queryInterface.bulkInsert('classes', [
      {
        schoolId,
        name: '1001',
        grade: '1º ano',
        segment: 'Ensino Fundamental',
        shift: 'Matutino',
        status: 'current',
        maxOccupancy: 20,
      },
      {
        schoolId,
        name: '2001',
        grade: '2º ano',
        segment: 'Ensino Fundamental',
        shift: 'Matutino',
        status: 'current',
        maxOccupancy: 22,
      },
      {
        schoolId,
        name: '2002',
        grade: '2º ano',
        segment: 'Ensino Fundamental',
        shift: 'Integral',
        status: 'current',
        maxOccupancy: 18,
      },
      {
        schoolId,
        name: '3004',
        grade: '3º ano',
        segment: 'Ensino Fundamental',
        shift: 'Vespertino',
        status: 'current',
        maxOccupancy: 20,
      },
      {
        schoolId,
        name: '4001',
        grade: '4º ano',
        segment: 'Ensino Fundamental',
        shift: 'Integral',
        status: 'current',
        maxOccupancy: 18,
      },
    ].map((row) => ({ ...row, createdAt: now, updatedAt: now })), {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('classes', null, {});
  },
};
