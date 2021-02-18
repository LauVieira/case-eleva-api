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
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    headteacher: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, 
  {
    sequelize,
    modelName: 'school',
  }
);

module.exports = School;
