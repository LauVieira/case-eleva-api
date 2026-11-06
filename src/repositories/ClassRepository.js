const Class = require('../models/Class');

class ClassRepository {
  findBySchoolId (schoolId) {
    return Class.findAll({
      where: { schoolId },
      order: [['name']],
    });
  }
}

module.exports = new ClassRepository();
