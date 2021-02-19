require('express-async-errors');
require('dotenv').config();
require('./utils/loadRelationships');

const express = require('express');
const cors = require('cors');
const sectorsRouter = require('./routers/sectorsRouter');
const schoolsRouter = require('./routers/schoolsRouter');
const Err = require('./errors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/sectors', sectorsRouter);
app.use('/schools', schoolsRouter);

/* eslint-disable-next-line no-unused-vars */
app.use((error, req, res, next) => {
  const { message } = error;
  
  if (error instanceof Err.NotFoundError) return res.status(404).send({ message });
  if (error instanceof Err.InvalidDataError) return res.status(422).send({ message });
  if (error instanceof Err.ConflictError) return res.status(409).send({ message });
  
  res.status(500).send('Erro interno no servidor');
  console.error(error);
});

module.exports = app;
