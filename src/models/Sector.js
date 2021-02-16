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
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    code: {
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
