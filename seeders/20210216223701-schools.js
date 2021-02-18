/* eslint-disable quotes */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sectors = await queryInterface.sequelize.query(
      `SELECT * FROM sectors WHERE code = 'SA-2';`
    );

    const sectorId = sectors[0][0].id;

    await queryInterface.bulkInsert('schools', [
      {
        sectorId,
        name: 'Colégio M. Ancyra Gonçalves Pimentel',
        address: 'Avenida Amaral Peixoto nº 555, Miramar - CEP: 27943-400',
        headteacher: 'Êda Luiz',
        phone: '(22)98131-0329'
      },
      {
        sectorId,
        name: 'CIEP 455 Municipalizado Maringá',
        address: 'Rua Dinamarca nº 72, Campo d\'Oeste - CEP: 27936-455',
        headteacher: 'Êda Luiz',
        phone: '(22)99104-9216'
      },
      {
        sectorId,
        name: 'Colégio E. Municipalizado Coquinho',
        address: 'Rua Professor Gusmão nº 400, Praia Campista - CEP: 27923-311',
        headteacher: 'Êda Luiz',
        phone: '(22)997459260'
      },
      {
        sectorId,
        name: 'Escola E. Municipalizada Polivalente Anísio Teixeira',
        address: 'Rua Jesus Soares Pereira s/nº, Costa do Sol - CEP: 27923-370',
        headteacher: 'Êda Luiz',
        phone: '(22)2796-1152'
      },
      {
        sectorId,
        name: 'Escola M. Amil Tanos',
        address: 'Rua Leopoldina Neves Pinheiro nº 160 - Morro de Santana, Aroeira - CEP: 27945-330',
        headteacher: 'Êda Luiz',
        phone: '(22)2770-7195'
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('schools', null, {});
  },
};
