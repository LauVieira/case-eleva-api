const { Sequelize } = require('sequelize');
const sequelize = require('../utils/database');

class School extends Sequelize.Model { }

School.init(
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    sectorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    headteacher: {
      type: Sequelize.STRING(150),
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING(14),
      allowNull: true,
    },
  }, 
  {
    sequelize,
    modelName: 'school',
  }
);

module.exports = School;
