const SchoolRepository = require('../repositories/SchoolRepository');
const ClassRepository = require('../repositories/ClassRepository');
const schoolSchema = require('../schemas/schoolSchema');
const { ConflictError, InvalidDataError, NotFoundError } = require('../errors');
const { sanitiseObj } = require('../utils/generalFunctions');

class SchoolService {
  async getSchoolById (id) {
    const schoolExists = await SchoolRepository.findById(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');

    return schoolExists;
  }

  async getClassesBySchool (id) {
    const schoolExists = await SchoolRepository.findById(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');

    return ClassRepository.findBySchoolId(id);
  }

  async createSchool (schoolData) {
    const sanitisedData = sanitiseObj(schoolData);
    const { error } = schoolSchema.post.validate(sanitisedData);
    if (error) throw new InvalidDataError('Não foi possível processar o formato dos dados');

    const schoolExists = await SchoolRepository.findByName(sanitisedData.name);
    if (!!schoolExists) throw new ConflictError('Já existe uma escola com este nome');

    const newSchool = await SchoolRepository.create(sanitisedData);

    return newSchool;
  }
}

module.exports = new SchoolService();
