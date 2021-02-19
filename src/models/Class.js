const { Sequelize } = require('sequelize');
const sequelize = require('../utils/database');

class Class extends Sequelize.Model { }

Class.init(
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    schoolId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    grade: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    segment: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    shift: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('current', 'completed'),
      allowNull: false,
    },
    maxOccupancy: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  }, 
  {
    sequelize,
    modelName: 'class',
  }
);

module.exports = Class;
