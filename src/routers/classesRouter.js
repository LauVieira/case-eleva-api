const router = require('express').Router();
const ClassController = require('../controllers/ClassController');

router.patch('/:id', ClassController.updateClass);

module.exports = router;
