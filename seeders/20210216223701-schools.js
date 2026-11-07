/* eslint-disable quotes */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const sectors = await queryInterface.sequelize.query(
      `SELECT * FROM sectors WHERE code = 'SA-2';`
    );

    const sectorId = sectors[0][0].id;

    await queryInterface.bulkInsert('schools', [
      {
        sectorId,
        name: 'colégio municipal ancyra gonçalves pimentel',
        address: 'Avenida Amaral Peixoto nº 555, Miramar - CEP: 27943-400',
        headteacher: 'Êda Luiz',
        phone: '+5522981310329'
      },
      {
        sectorId,
        name: 'centro integrado de educação pública 455 municipalizado maringá',
        address: 'Rua Dinamarca nº 72, Campo d\'Oeste - CEP: 27936-455',
        headteacher: 'Êda Luiz',
        phone: '+5522991049216'
      },
      {
        sectorId,
        name: 'colégio estadual municipalizado coquinho',
        address: 'Rua Professor Gusmão nº 400, Praia Campista - CEP: 27923-311',
        headteacher: 'Êda Luiz',
        phone: '+5522997459260'
      },
      {
        sectorId,
        name: 'escola estadual municipalizada polivalente anísio teixeira',
        address: 'Rua Jesus Soares Pereira s/nº, Costa do Sol - CEP: 27923-370',
        headteacher: 'Êda Luiz',
        phone: '+552227961152'
      },
      {
        sectorId,
        name: 'escola municipal amil tanos',
        address: 'Rua Leopoldina Neves Pinheiro nº 160 - Morro de Santana, Aroeira - CEP: 27945-330',
        headteacher: 'Êda Luiz',
        phone: '+552227707195'
      },
    ].map((row) => ({ ...row, createdAt: now, updatedAt: now })), {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('schools', null, {});
  },
};
