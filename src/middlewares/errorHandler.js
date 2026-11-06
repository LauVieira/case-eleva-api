const Err = require('../errors');

/* eslint-disable-next-line no-unused-vars */
function errorHandler (error, req, res, next) {
  const { message } = error;

  if (error instanceof Err.NotFoundError) return res.status(404).send({ message });
  if (error instanceof Err.InvalidDataError) return res.status(422).send({ message });
  if (error instanceof Err.ConflictError) return res.status(409).send({ message });

  res.status(500).send('Erro interno no servidor');
  console.error(error);
}

module.exports = errorHandler;
