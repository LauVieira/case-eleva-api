const SchoolRepository = require('../repositories/SchoolRepository');
const SectorRepository = require('../repositories/SectorRepository');
const ClassRepository = require('../repositories/ClassRepository');
const schoolSchema = require('../schemas/schoolSchema');
const { ConflictError, InvalidDataError, NotFoundError } = require('../errors');
const { sanitiseObj } = require('../utils/generalFunctions');
const validateId = require('../utils/validateId');
const normaliseName = require('../utils/normaliseName');
const classListSchema = require('../schemas/classListSchema');

class SchoolService {
  async getSchoolById (id) {
    id = validateId(id);
    const schoolExists = await SchoolRepository.findDetailsById(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');

    const totalCapacity = await ClassRepository.sumCurrentCapacity(id);
    return { ...schoolExists, totalCapacity };
  }

  async getClassesBySchool (id, status = 'current') {
    id = validateId(id);
    const { error } = classListSchema.validate({ status });
    if (error) throw new InvalidDataError(error.details[0].message);
    const schoolExists = await SchoolRepository.findById(id);
    if (!schoolExists) throw new NotFoundError('Escola não encontrada');

    return ClassRepository.findBySchoolId(id, status);
  }

  async createSchool (schoolData) {
    const sanitisedData = sanitiseObj(schoolData);
    if (sanitisedData && !Array.isArray(sanitisedData)) {
      sanitisedData.name = normaliseName(sanitisedData.name);
      if (sanitisedData.headteacher === undefined || sanitisedData.headteacher === '') sanitisedData.headteacher = null;
      if (sanitisedData.phone === undefined) sanitisedData.phone = null;
    }
    const { error, value: validatedData } = schoolSchema.post.validate(sanitisedData);
    if (error) throw new InvalidDataError(error.details[0].message);

    const schoolExists = await SchoolRepository.findByName(validatedData.name);
    if (!!schoolExists) throw new ConflictError('Já existe uma escola com este nome');

    const sectorExists = await SectorRepository.findById(validatedData.sectorId);
    if (!sectorExists) {
      throw new InvalidDataError('sectorId: setor não encontrado. Informe um setor existente.');
    }

    const newSchool = await SchoolRepository.create(validatedData);

    return newSchool;
  }
}

module.exports = new SchoolService();
