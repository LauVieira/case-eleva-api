const Sector = require('../models/Sector');
const School = require('../models/School');
const { NotFoundError } = require('../errors');

class SectorController {
  getAll () {
    return Sector.findAll({ order: [
      ['name']]
    });
  }

  async getSchoolsBySector (id) {
    const sectorExists = await Sector.findByPk(id);
    if (!sectorExists) throw new NotFoundError('Setor não encontrado');

    return School.findAll({
      where: { sectorId: id },
      order: [['name']]
    });
  }
}

module.exports = new SectorController();
