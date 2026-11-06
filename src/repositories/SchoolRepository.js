const School = require('../models/School');

class SchoolRepository {
  findBySectorId (sectorId) {
    return School.findAll({
      where: { sectorId },
      order: [['name']],
    });
  }
}

module.exports = new SchoolRepository();
