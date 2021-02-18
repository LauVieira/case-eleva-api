const Sector = require('../models/Sector');
const School = require('../models/School');

class SectorController {
  getAll () {
    return Sector.findAll({ order: [
      ['name']]
    });
  }

  getSchoolsBySector (id) {
    return School.findAll({
      where: { sectorId: id },
      order: [['name']]
    });
  }
}

module.exports = new SectorController();
