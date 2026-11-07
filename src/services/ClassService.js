const ClassRepository = require('../repositories/ClassRepository');
const SchoolRepository = require('../repositories/SchoolRepository');
const classSchema = require('../schemas/classSchema');
const { GRADES_BY_SEGMENT } = require('../constants/classOptions');
const { ConflictError, InvalidDataError, NotFoundError } = require('../errors');
const { sanitiseObj } = require('../utils/generalFunctions');
const normaliseName = require('../utils/normaliseName');
const validateId = require('../utils/validateId');

class ClassService {
  async createClass (schoolId, classData) {
    schoolId = validateId(schoolId);
    const sanitised = sanitiseObj(classData);
    if (sanitised && !Array.isArray(sanitised)) sanitised.name = normaliseName(sanitised.name);

    const { error, value: data } = classSchema.post.validate(sanitised);
    if (error) throw new InvalidDataError(error.details[0].message);

    const grades = GRADES_BY_SEGMENT[data.segment];
    if (!grades.includes(data.grade)) {
      throw new InvalidDataError(`"grade" deve pertencer ao segmento "${data.segment}". Informe uma das opções: ${grades.join(', ')}.`);
    }

    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('Escola não encontrada');

    if (data.status === 'current') {
      const duplicate = await ClassRepository.findCurrentByName(schoolId, data.name);
      if (duplicate) throw new ConflictError('Já existe uma turma ativa com este nome nesta escola. Informe outro nome.');
    }

    return ClassRepository.create({ ...data, schoolId });
  }
}

module.exports = new ClassService();
