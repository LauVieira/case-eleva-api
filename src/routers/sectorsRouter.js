const router = require('express').Router();

const SectorController = require('../controllers/SectorController');

router.get('/', async (req, res) => {
  const sectors = await SectorController.getAll();
  res.status(200).send(sectors);
});

router.get('/:id/schools', async (req, res) => {
  const { id } = req.params;

  const sectorSchools = await SectorController.getSchoolsBySector(id);
  res.status(200).send(sectorSchools);
});

module.exports = router;
