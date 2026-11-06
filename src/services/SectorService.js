const SectorRepository = require('../repositories/SectorRepository');
const SchoolRepository = require('../repositories/SchoolRepository');
const { NotFoundError } = require('../errors');

class SectorService {
  getAll () {
    return SectorRepository.findAll();
  }

  async getSchoolsBySector (id) {
    const sectorExists = await SectorRepository.findById(id);
    if (!sectorExists) throw new NotFoundError('Setor não encontrado');

    return SchoolRepository.findBySectorId(id);
  }
}

module.exports = new SectorService();
