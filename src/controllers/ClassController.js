const ClassService = require('../services/ClassService');

class ClassController {
  async updateClass (req, res) {
    const updated = await ClassService.updateClass(req.params.id, req.body);
    res.status(200).send(updated);
  }
}

module.exports = new ClassController();
