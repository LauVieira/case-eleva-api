module.exports = {
  async up (queryInterface, Sequelize) {
    const schema = queryInterface.sequelize.options.define.schema || 'public';
    const schools = { tableName: 'schools', schema };
    const classes = { tableName: 'classes', schema };
    const quoted = queryInterface.queryGenerator.quoteIdentifier(schema);
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(schools, 'name', { type: Sequelize.STRING(100), allowNull: false }, { transaction });
      await queryInterface.changeColumn(schools, 'headteacher', { type: Sequelize.STRING(150), allowNull: true }, { transaction });
      await queryInterface.changeColumn(schools, 'phone', { type: Sequelize.STRING(14), allowNull: true }, { transaction });
      await queryInterface.changeColumn(classes, 'name', { type: Sequelize.STRING(50), allowNull: false }, { transaction });
      await queryInterface.sequelize.query(`ALTER TABLE ${quoted}."classes" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text; DROP TYPE IF EXISTS ${quoted}."enum_classes_status";`, { transaction });
      await queryInterface.sequelize.query(`ALTER TABLE ${quoted}."classes" ADD CONSTRAINT classes_status_values CHECK (status IN ('current', 'completed')), ADD CONSTRAINT classes_max_occupancy_nonnegative CHECK ("maxOccupancy" >= 0), ADD CONSTRAINT classes_name_not_empty CHECK (char_length(btrim(name)) > 0); ALTER TABLE ${quoted}."schools" ADD CONSTRAINT schools_name_not_empty CHECK (char_length(btrim(name)) > 0), ADD CONSTRAINT schools_phone_canonical CHECK (phone IS NULL OR phone ~ '^[+]55[0-9]{10,11}$');`, { transaction });
      await queryInterface.addIndex(classes, ['schoolId', 'name'], { unique: true, where: { status: 'current' }, name: 'classes_current_name_unique', transaction });
    });
  },
  async down (queryInterface, Sequelize) {
    const schema = queryInterface.sequelize.options.define.schema || 'public';
    const quoted = queryInterface.queryGenerator.quoteIdentifier(schema);
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`DROP INDEX ${quoted}."classes_current_name_unique"; ALTER TABLE ${quoted}."classes" DROP CONSTRAINT classes_status_values, DROP CONSTRAINT classes_max_occupancy_nonnegative, DROP CONSTRAINT classes_name_not_empty; ALTER TABLE ${quoted}."schools" DROP CONSTRAINT schools_name_not_empty, DROP CONSTRAINT schools_phone_canonical; CREATE TYPE ${quoted}."enum_classes_status" AS ENUM ('current', 'completed'); ALTER TABLE ${quoted}."classes" ALTER COLUMN status TYPE ${quoted}."enum_classes_status" USING status::${quoted}."enum_classes_status";`, { transaction });
      await queryInterface.changeColumn({ tableName: 'schools', schema }, 'name', { type: Sequelize.STRING, allowNull: false }, { transaction });
      await queryInterface.changeColumn({ tableName: 'schools', schema }, 'headteacher', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.changeColumn({ tableName: 'schools', schema }, 'phone', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.changeColumn({ tableName: 'classes', schema }, 'name', { type: Sequelize.STRING, allowNull: false }, { transaction });
    });
  },
};
