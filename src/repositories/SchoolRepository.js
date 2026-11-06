const School = require('../models/School');

class SchoolRepository {
  findById (id) {
    return School.findByPk(id);
  }

  findByName (name) {
    return School.findOne({
      where: { name },
    });
  }

  findBySectorId (sectorId) {
    return School.findAll({
      where: { sectorId },
      order: [['name']],
    });
  }

  create (schoolData) {
    return School.create(schoolData);
  }
}

module.exports = new SchoolRepository();
