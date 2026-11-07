const Class = require('../models/Class');

class ClassRepository {
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
