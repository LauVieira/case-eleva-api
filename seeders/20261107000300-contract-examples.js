module.exports = {
  async up (queryInterface) {
    const now = new Date();
    const [sectors] = await queryInterface.sequelize.query('SELECT id FROM sectors WHERE code = :code', { replacements: { code: 'SA-1' } });
    const [created] = await queryInterface.sequelize.query('INSERT INTO schools ("sectorId", name, address, headteacher, phone, "createdAt", "updatedAt") VALUES (:sectorId, :name, :address, NULL, NULL, :now, :now) RETURNING id', {
      replacements: { sectorId: sectors[0].id, name: 'escola de demonstração', address: 'Rua de demonstração, 10', now },
    });
    await queryInterface.bulkInsert('classes', [
      { schoolId: created[0].id, name: 'turma a', segment: 'Educação Infantil — Creche', grade: 'Berçário', shift: 'Integral', status: 'current', maxOccupancy: 0, createdAt: now, updatedAt: now },
      { schoolId: created[0].id, name: 'turma a', segment: 'Ensino Médio', grade: '1º ano', shift: 'Noturno', status: 'completed', maxOccupancy: 25, createdAt: now, updatedAt: now },
      { schoolId: created[0].id, name: 'jardim', segment: 'Educação Infantil — Pré-escola', grade: 'Jardim I', shift: 'Matutino', status: 'current', maxOccupancy: 15, createdAt: now, updatedAt: now },
    ]);
  },
  async down (queryInterface) {
    const options = { replacements: { name: 'escola de demonstração' } };
    await queryInterface.sequelize.query('DELETE FROM classes WHERE "schoolId" IN (SELECT id FROM schools WHERE name = :name)', options);
    await queryInterface.sequelize.query('DELETE FROM schools WHERE name = :name', options);
  },
};
