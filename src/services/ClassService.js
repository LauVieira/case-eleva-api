const ClassRepository = require('../repositories/ClassRepository');
const SchoolRepository = require('../repositories/SchoolRepository');
const classSchema = require('../schemas/classSchema');
const { GRADES_BY_SEGMENT } = require('../constants/classOptions');
const { ConflictError, InvalidDataError, NotFoundError, UpdateError, DeleteError } = require('../errors');
const { sanitiseObj } = require('../utils/generalFunctions');
const normaliseName = require('../utils/normaliseName');
const validateId = require('../utils/validateId');

class ClassService {
  validateGrade (segment, grade) {
    const grades = GRADES_BY_SEGMENT[segment];
    if (!grades.includes(grade)) {
      throw new InvalidDataError(`"grade" deve pertencer ao segmento "${segment}". Informe uma das opções: ${grades.join(', ')}.`);
    }
  }

  async createClass (schoolId, classData) {
    schoolId = validateId(schoolId);
    const sanitised = sanitiseObj(classData);
    if (sanitised && !Array.isArray(sanitised)) sanitised.name = normaliseName(sanitised.name);

    const { error, value: data } = classSchema.post.validate(sanitised);
    if (error) throw new InvalidDataError(error.details[0].message);

    this.validateGrade(data.segment, data.grade);

    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('Escola não encontrada');

    if (data.status === 'current') {
      const duplicate = await ClassRepository.findCurrentByName(schoolId, data.name);
      if (duplicate) throw new ConflictError('Já existe uma turma ativa com este nome nesta escola. Informe outro nome.');
    }

    return ClassRepository.create({ ...data, schoolId });
  }

  async updateClass (id, classData) {
    id = validateId(id);
    const sanitised = sanitiseObj(classData);
    if (sanitised && !Array.isArray(sanitised) && sanitised.name !== undefined) {
      sanitised.name = normaliseName(sanitised.name);
    }
    const { error, value: changes } = classSchema.patch.validate(sanitised);
    if (error) throw new InvalidDataError(error.details[0].message);

    const classRecord = await ClassRepository.findById(id);
    if (!classRecord) throw new NotFoundError('Turma não encontrada');

    const current = {
      name: classRecord.name,
      grade: classRecord.grade,
      segment: classRecord.segment,
      shift: classRecord.shift,
      status: classRecord.status,
      maxOccupancy: classRecord.maxOccupancy,
    };
    const { error: stateError, value: result } = classSchema.post.validate({ ...current, ...changes });
    if (stateError) throw new InvalidDataError(stateError.details[0].message);
    this.validateGrade(result.segment, result.grade);

    if (result.status === 'current') {
      const duplicate = await ClassRepository.findCurrentByName(classRecord.schoolId, result.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('Já existe uma turma ativa com este nome nesta escola. Informe outro nome.');
      }
    }

    let updated;
    try {
      updated = await ClassRepository.update(classRecord, changes);
    } catch (updateError) {
      if (updateError instanceof ConflictError) throw updateError;
      throw new UpdateError('Não foi possível atualizar a turma. Tente novamente.', updateError);
    }
    if (!updated) throw new UpdateError('Não foi possível atualizar a turma. Tente novamente.');
    return updated;
  }

  async deleteClass (id) {
    id = validateId(id);
    const classRecord = await ClassRepository.findById(id);
    if (!classRecord) throw new NotFoundError('Turma não encontrada');

    let deleted;
    try {
      deleted = await ClassRepository.delete(id);
    } catch (error) {
      throw new DeleteError('Não foi possível excluir a turma. Tente novamente.', error);
    }
    if (!deleted) throw new DeleteError('Não foi possível excluir a turma. Tente novamente.');
  }
}

module.exports = new ClassService();
