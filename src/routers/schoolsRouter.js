const router = require('express').Router();

const SchoolController = require('../controllers/SchoolController');

router.get('/:id', SchoolController.getSchoolById);

router.get('/:id/classes', SchoolController.getClassesBySchool);

router.post('/', SchoolController.createSchool);

router.patch('/:id', SchoolController.updateSchool);

router.delete('/:id', SchoolController.deleteSchool);

module.exports = router;
