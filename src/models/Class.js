const { Sequelize } = require('sequelize');
const sequelize = require('../utils/database');
const { GRADES_BY_SEGMENT, SHIFTS, STATUSES } = require('../constants/classOptions');
const normaliseName = require('../utils/normaliseName');

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
      type: Sequelize.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
        canonical (value) {
          if (value !== normaliseName(value)) throw new Error('name deve estar normalizado');
        },
      },
    },
    grade: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    segment: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: { isIn: [Object.keys(GRADES_BY_SEGMENT)] },
    },
    shift: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: { isIn: [SHIFTS] },
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      validate: { isIn: [STATUSES] },
    },
    maxOccupancy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 0, max: 2147483647 },
    },
  }, 
  {
    sequelize,
    modelName: 'class',
    validate: {
      gradeBelongsToSegment () {
        const grades = GRADES_BY_SEGMENT[this.segment];
        if (!grades || !grades.includes(this.grade)) throw new Error('grade incompatível com segment');
      },
    },
  }
);

module.exports = Class;
