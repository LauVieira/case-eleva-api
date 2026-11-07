const Joi = require('joi');
const validationMessages = require('./validationMessages');

const post = Joi.object({
  sectorId: Joi.number().integer().positive().max(2147483647).required(),
  name: Joi.string().max(100).required(),
  address: Joi.string().max(255).required(),
  headteacher: Joi.string().max(150).allow(null),
  phone: Joi.string().pattern(/^\+55\d{10,11}$/).allow(null).strict(),
}).messages(validationMessages);

const patch = post.fork(['sectorId', 'name', 'address'], (field) => field.optional())
  .min(1).required().messages({
    'object.min': 'Informe pelo menos um campo da escola para atualizar.',
  });

module.exports = {
  post,
  patch,
};
