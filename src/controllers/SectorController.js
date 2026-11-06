const Sector = require('../models/Sector');
const School = require('../models/School');
const { NotFoundError } = require('../errors');
const SectorService = require('../services/SectorService');

class SectorController {
  async getAll (req, res) {
    const sectors = await SectorService.getAll();
    res.status(200).send(sectors);
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
