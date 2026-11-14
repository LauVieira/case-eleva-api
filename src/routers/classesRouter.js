const router = require('express').Router();
const ClassController = require('../controllers/ClassController');

router.get('/:id', ClassController.getClassById);

router.patch('/:id', ClassController.updateClass);

router.delete('/:id', ClassController.deleteClass);

module.exports = router;
