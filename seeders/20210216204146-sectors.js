'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('sectors', [
      {
        name: 'Setor Azul',
        code: 'SA-1',
        color: '#00c5ff',
      },
      {
        name: 'Setor Amarelo',
        code: 'SA-2',
        color: '#ffff00',
      },
      {
        name: 'Setor Verde',
        code: 'SA-3',
        color: '#55ff00',
      },
      {
        name: 'Setor Vermelho',
        code: 'SA-4',
        color: '#ff0000',
      },
      {
        name: 'Setor Vinho',
        code: 'SA-5',
        color: '#73004c',
      },
      {
        name: 'Setor Marrom',
        code: 'SA-6',
        color: '#732600',
      },
      {
        name: 'Setor Bege',
        code: 'SA-7',
        color: '#ffebbe',
      },
      {
        name: 'Setor Laranja',
        code: 'SA-8',
        color: '#ffaa00',
      },
      {
        name: 'Setor Cinza',
        code: 'SA-9',
        color: '#828282',
      },
      {
        name: 'Setor Azul Marinho',
        code: 'SA-10',
        color: '#002673',
      },
      {
        name: 'Setor Branco',
        code: 'SA-11',
        color: '#ffffff',
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sectors', null, {});
  },
};
