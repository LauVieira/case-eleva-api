const Sector = require('../models/Sector');
const School = require('../models/School');

School.belongsTo(Sector);
Sector.hasMany(School);
