const Sector = require('../models/Sector');

class SectorRepository {
  findAll () {
    return Sector.findAll({
      order: [['name']],
    });
  }
}

module.exports = new SectorRepository();
