const Class = require('../models/Class');
const School = require('../models/School');
const Sector = require('../models/Sector');

School.belongsTo(Sector);
Sector.hasMany(School);
Class.belongsTo(School);
School.hasMany(Class);
