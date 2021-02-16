const { Sequelize } = require('sequelize');
const sequelize = require('../utils/database');

class Sector extends Sequelize.Model { }

User.init(
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    sector: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    color: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, 
  {
    sequelize,
    modelName: 'sector',
  }
);

module.exports = Sector;
