const Class = require('./Class');
const School = require('./School');
const Sector = require('./Sector');

School.belongsTo(Sector);
Sector.hasMany(School);
Class.belongsTo(School);
School.hasMany(Class);
