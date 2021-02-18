const School = require('../models/School');

class SchoolController {
  getSchoolById (id) {
    return School.findByPk(id);
  }
}

module.exports = new SchoolController();
