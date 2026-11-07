const Joi = require('joi');
const { STATUSES } = require('../constants/classOptions');
const validationMessages = require('./validationMessages');

module.exports = Joi.object({
  status: Joi.string().valid(...STATUSES, 'all').required(),
}).messages(validationMessages);
