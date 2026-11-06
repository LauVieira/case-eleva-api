const School = require('../models/School');
const Class = require('../models/Class');
const { NotFoundError } = require('../errors');
const SchoolService = require('../services/SchoolService');

class SchoolController {
  async getSchoolById (id) {
    const schoolExists = await School.findByPk(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');

    return schoolExists;
  }

  async getClassesBySchool (id) {
    const schoolExists = await School.findByPk(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');
    
    return Class.findAll({
      where: { schoolId: id },
      order: [['name']]
    });
  }

  async createSchool (req, res) {
    const newSchool = await SchoolService.createSchool(req.body);
    res.status(201).send(newSchool);
  }
}

module.exports = new SchoolController();
