const SchoolRepository = require('../repositories/SchoolRepository');
const SectorRepository = require('../repositories/SectorRepository');
const ClassRepository = require('../repositories/ClassRepository');
const schoolSchema = require('../schemas/schoolSchema');
const { ConflictError, InvalidDataError, NotFoundError, UpdateError } = require('../errors');
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

  async validateSectorChange (sectorId, name, schoolId) {
    const sector = await SectorRepository.findById(sectorId);
    if (!sector) {
      throw new InvalidDataError('sectorId: setor não encontrado. Informe um setor existente.');
    }

    const duplicate = await SchoolRepository.findByName(name);
    if (duplicate && duplicate.id !== schoolId && duplicate.sectorId === sectorId) {
      throw new ConflictError('Já existe uma escola com este nome neste setor');
    }
  }

  async updateSchool (id, schoolData) {
    id = validateId(id);
    const sanitisedData = sanitiseObj(schoolData);
    if (sanitisedData && !Array.isArray(sanitisedData)) {
      if (sanitisedData.name !== undefined) sanitisedData.name = normaliseName(sanitisedData.name);
      if (sanitisedData.headteacher === '') sanitisedData.headteacher = null;
    }
    const { error, value: changes } = schoolSchema.patch.validate(sanitisedData);
    if (error) throw new InvalidDataError(error.details[0].message);

    const school = await SchoolRepository.findById(id);
    if (!school) throw new NotFoundError('Escola não encontrada');

    const current = {
      sectorId: school.sectorId,
      name: school.name,
      address: school.address,
      headteacher: school.headteacher,
      phone: school.phone,
    };
    const { error: stateError, value: result } = schoolSchema.post.validate({ ...current, ...changes });
    if (stateError) throw new InvalidDataError(stateError.details[0].message);

    if (changes.sectorId !== undefined) {
      await this.validateSectorChange(result.sectorId, result.name, id);
    }
    if (changes.name !== undefined) {
      const duplicate = await SchoolRepository.findByName(result.name);
      if (duplicate && duplicate.id !== id) throw new ConflictError('Já existe uma escola com este nome');
    }

    let updated;
    try {
      updated = await SchoolRepository.update(id, changes);
    } catch (updateError) {
      if (updateError instanceof ConflictError) {
        if (changes.sectorId !== undefined) {
          await this.validateSectorChange(result.sectorId, result.name, id);
        }
        throw updateError;
      }
      throw new UpdateError('Não foi possível atualizar a escola. Tente novamente.', updateError);
    }
    if (!updated) throw new UpdateError('Não foi possível atualizar a escola. Tente novamente.');
    return updated;
  }
}

module.exports = new SchoolService();
