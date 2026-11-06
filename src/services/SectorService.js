const SectorRepository = require('../repositories/SectorRepository');

class SectorService {
  getAll () {
    return SectorRepository.findAll();
  }
}

module.exports = new SectorService();
