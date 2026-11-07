const Class = require('../models/Class');
const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { ConflictError, NotFoundError } = require('../errors');

class ClassRepository {
  findById (id) {
    return Class.findByPk(id);
  }

  delete (id) {
    return Class.destroy({ where: { id } });
  }

  async update (classRecord, changes) {
    try {
      return await classRecord.update(changes, { returning: true });
    } catch (error) {
      if (error instanceof UniqueConstraintError && error.parent.constraint === 'classes_current_name_unique') {
        throw new ConflictError('Já existe uma turma ativa com este nome nesta escola. Informe outro nome.');
      }
      throw error;
    }
  }

  findCurrentByName (schoolId, name) {
    return Class.findOne({ where: { schoolId, name, status: 'current' } });
  }

  async create (classData) {
    try {
      return await Class.create(classData);
    } catch (error) {
      if (error instanceof UniqueConstraintError && error.parent.constraint === 'classes_current_name_unique') {
        throw new ConflictError('Já existe uma turma ativa com este nome nesta escola. Informe outro nome.');
      }
      if (error instanceof ForeignKeyConstraintError && error.parent.constraint === 'classes_schoolId_fkey') {
        throw new NotFoundError('Escola não encontrada');
      }
      throw error;
    }
  }

  async existsBySchoolId (schoolId) {
    const existing = await Class.findOne({ where: { schoolId }, attributes: ['id'], raw: true });
    return !!existing;
  }

  async sumCurrentCapacity (schoolId) {
    const total = await Class.sum('maxOccupancy', { where: { schoolId, status: 'current' } });
    return Number(total || 0);
  }

  findBySchoolId (schoolId, status = 'current') {
    const where = { schoolId };
    if (status !== 'all') where.status = status;
    return Class.findAll({
      where,
      order: [['name']],
    });
  }
}

module.exports = new ClassRepository();
