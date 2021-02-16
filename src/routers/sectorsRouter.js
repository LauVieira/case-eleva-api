const router = require('express').Router();

const SectorController = require('../controllers/SectorController');

router.get('/', async (req, res) => {
  const sectors = await SectorController.getAll();
  res.status(200).send(sectors);
});

module.exports = router;
