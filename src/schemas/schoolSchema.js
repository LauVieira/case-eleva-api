const Joi = require('joi');
const validationMessages = require('./validationMessages');

const post = Joi.object({
  sectorId: Joi.number().integer().positive().max(2147483647).required(),
  name: Joi.string().max(100).required(),
  address: Joi.string().max(255).required(),
  headteacher: Joi.string().max(150).allow(null),
  phone: Joi.string().pattern(/^\+55\d{10,11}$/).allow(null).strict(),
}).messages(validationMessages);

module.exports = {
  post
};
