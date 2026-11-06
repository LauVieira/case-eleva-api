require('express-async-errors');
require('dotenv').config();
require('./models/associations');

const express = require('express');
const cors = require('cors');
const sectorsRouter = require('./routers/sectorsRouter');
const schoolsRouter = require('./routers/schoolsRouter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/sectors', sectorsRouter);
app.use('/schools', schoolsRouter);

app.use(errorHandler);

module.exports = app;
