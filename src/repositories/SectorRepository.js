const Sector = require('../models/Sector');

class SectorRepository {
  findById (id) {
    return Sector.findByPk(id);
  }

  findAll () {
    return Sector.findAll({
      order: [['name']],
    });
  }
}

module.exports = new SectorRepository();
