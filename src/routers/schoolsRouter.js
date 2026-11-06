const router = require('express').Router();

const SchoolController = require('../controllers/SchoolController');

router.get('/:id', SchoolController.getSchoolById);

router.get('/:id/classes', async (req, res) => {
  const { id } = req.params;

  const classesList = await SchoolController.getClassesBySchool(id);
  res.status(200).send(classesList);
});

router.post('/', SchoolController.createSchool);

module.exports = router;
