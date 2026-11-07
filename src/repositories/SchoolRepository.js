const School = require('../models/School');
const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { ConflictError } = require('../errors');

class SchoolRepository {
  findById (id) {
    return School.findByPk(id);
  }

  findDetailsById (id) {
    return School.findByPk(id, { raw: true });
  }

  findByName (name) {
    return School.findOne({
      where: { name },
    });
  }

  findBySectorId (sectorId) {
    return School.findAll({
      where: { sectorId },
      order: [['name']],
    });
  }

  async create (schoolData) {
    try {
      return await School.create(schoolData);
    } catch (error) {
      if (error instanceof UniqueConstraintError && error.parent.constraint === 'schools_name_key') {
        throw new ConflictError('Já existe uma escola com este nome');
      }
      throw error;
    }
  }

  async update (id, schoolData) {
    try {
      const [, schools] = await School.update(schoolData, { where: { id }, returning: true });
      return schools[0] || null;
    } catch (error) {
      if (error instanceof UniqueConstraintError && error.parent.constraint === 'schools_name_key') {
        throw new ConflictError('Já existe uma escola com este nome');
      }
      throw error;
    }
  }

  async delete (id) {
    try {
      return await School.destroy({ where: { id } });
    } catch (error) {
      if (error instanceof ForeignKeyConstraintError && error.parent.constraint === 'classes_schoolId_fkey') {
        throw new ConflictError('Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente.');
      }
      throw error;
    }
  }
}

module.exports = new SchoolRepository();
