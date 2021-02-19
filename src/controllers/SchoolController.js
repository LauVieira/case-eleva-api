const School = require('../models/School');
const Class = require('../models/Class');

class SchoolController {
  getSchoolById (id) {
    return School.findByPk(id);
  }

  getClassesBySchool (id) {
    return Class.findAll({
      where: { schoolId: id },
      order: [['name']]
    });
  }
}

module.exports = new SchoolController();
