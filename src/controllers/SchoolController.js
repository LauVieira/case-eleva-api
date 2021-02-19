const School = require('../models/School');
const Class = require('../models/Class');
const schoolSchema = require('../schemas/schoolSchema');
const { ConflictError, InvalidDataError } = require('../errors');
const { sanitiseObj } = require('../utils/generalFunctions');

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

  async createSchool (schoolData) {
    const { error } = schoolSchema.post.validate(schoolData);
    if (error) throw new InvalidDataError('Não foi possível processar o formato dos dados');

    const schoolExists = await School.findOne({
      where: { name: schoolData.name }
    });
    if (!!schoolExists) throw new ConflictError('Já existe uma escola com este nome');

    const sanitisedData = sanitiseObj(schoolData);
    const newSchool = await School.create(sanitisedData);
    
    return newSchool;
  }
}

module.exports = new SchoolController();
