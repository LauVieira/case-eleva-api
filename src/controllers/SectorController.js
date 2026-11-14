const SectorService = require('../services/SectorService');

class SectorController {
  async getAll (req, res) {
    const sectors = await SectorService.getAll();
    res.status(200).send(sectors);
  }

  async getSchoolsBySector (req, res) {
    const { id } = req.params;
    const sectorSchools = await SectorService.getSchoolsBySector(id);
    res.status(200).send(sectorSchools);
  }
}

module.exports = new SectorController();
