const Sector = require('../models/Sector');

class SectorController {
  getAll () {
    return Sector.findAll();
  }
}

module.exports = new SectorController();
