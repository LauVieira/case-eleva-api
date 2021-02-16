const Sector = require('../models/Sector');
const School = require('../models/School');

Sector.hasMany(School);
