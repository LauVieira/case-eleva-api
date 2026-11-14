const Joi = require('joi');
const { InvalidDataError } = require('../errors');
const validationMessages = require('../schemas/validationMessages');

const schema = Joi.object({
  id: Joi.number().integer().positive().max(2147483647).required(),
}).messages(validationMessages);

function validateId (id) {
  const { error, value } = schema.validate({ id });
  if (error) throw new InvalidDataError(error.details[0].message);
  return value.id;
}

module.exports = validateId;
