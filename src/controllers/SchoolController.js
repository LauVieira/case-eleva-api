const SchoolService = require('../services/SchoolService');
const ClassService = require('../services/ClassService');

class SchoolController {
  async getSchoolById (req, res) {
    const { id } = req.params;
    const schoolData = await SchoolService.getSchoolById(id);
    res.status(200).send(schoolData);
  }

  async getClassesBySchool (req, res) {
    const { id } = req.params;
    const classesList = await SchoolService.getClassesBySchool(id, req.query.status);
    res.status(200).send(classesList);
  }

  async createSchool (req, res) {
    const newSchool = await SchoolService.createSchool(req.body);
    res.status(201).send(newSchool);
  }

  async createClass (req, res) {
    const created = await ClassService.createClass(req.params.id, req.body);
    res.status(201).send(created);
  }

  async updateSchool (req, res) {
    const school = await SchoolService.updateSchool(req.params.id, req.body);
    res.status(200).send(school);
  }

  async deleteSchool (req, res) {
    await SchoolService.deleteSchool(req.params.id);
    res.status(204).send();
  }
}

module.exports = new SchoolController();
