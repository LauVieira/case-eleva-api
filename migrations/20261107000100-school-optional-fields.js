module.exports = {
  async up (queryInterface, Sequelize) {
    const schema = queryInterface.sequelize.options.define.schema || 'public';
    const table = { tableName: 'schools', schema };
    await queryInterface.changeColumn(table, 'headteacher', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn(table, 'phone', { type: Sequelize.STRING, allowNull: true });
  },
  async down (queryInterface, Sequelize) {
    const schema = queryInterface.sequelize.options.define.schema || 'public';
    const table = { tableName: 'schools', schema };
    await queryInterface.changeColumn(table, 'headteacher', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.changeColumn(table, 'phone', { type: Sequelize.STRING, allowNull: false });
  },
};
