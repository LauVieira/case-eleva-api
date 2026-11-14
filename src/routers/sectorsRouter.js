const router = require('express').Router();

const SectorController = require('../controllers/SectorController');

router.get('/', SectorController.getAll);

router.get('/:id/schools', SectorController.getSchoolsBySector);

module.exports = router;
