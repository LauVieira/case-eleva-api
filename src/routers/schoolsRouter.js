const router = require('express').Router();

const SchoolController = require('../controllers/SchoolController');

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const schoolData = await SchoolController.getSchoolById(id);
  res.status(200).send(schoolData);
});

router.get('/:id/classes', async (req, res) => {
  const { id } = req.params;

  const classesList = await SchoolController.getClassesBySchool(id);
  res.status(200).send(classesList);
});

module.exports = router;
