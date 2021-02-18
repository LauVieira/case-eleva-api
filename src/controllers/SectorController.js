const Sector = require('../models/Sector');

class SectorController {
  getAll () {
    return Sector.findAll({ order: [
      ['name']]
    });
  }
}

module.exports = new SectorController();
