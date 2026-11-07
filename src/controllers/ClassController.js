const ClassService = require('../services/ClassService');

class ClassController {
  async getClassById (req, res) {
    const classRecord = await ClassService.getClassById(req.params.id);
    res.status(200).send(classRecord);
  }

  async updateClass (req, res) {
    const updated = await ClassService.updateClass(req.params.id, req.body);
    res.status(200).send(updated);
  }

  async deleteClass (req, res) {
    await ClassService.deleteClass(req.params.id);
    res.status(204).send();
  }
}

module.exports = new ClassController();
