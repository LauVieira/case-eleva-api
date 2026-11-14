const Joi = require('joi');
const { GRADES_BY_SEGMENT, SHIFTS, STATUSES } = require('../constants/classOptions');
const validationMessages = require('./validationMessages');

const post = Joi.object({
  name: Joi.string().max(50).required(),
  grade: Joi.string().required(),
  segment: Joi.string().valid(...Object.keys(GRADES_BY_SEGMENT)).required(),
  shift: Joi.string().valid(...SHIFTS).required(),
  status: Joi.string().valid(...STATUSES).required(),
  maxOccupancy: Joi.number().integer().min(0).max(2147483647).required(),
}).required().messages({
  ...validationMessages,
  'object.base': 'O corpo da requisição deve ser um objeto com os campos da turma.',
  'number.base': '{{#label}} deve ser um número inteiro maior ou igual a zero.',
  'number.min': '{{#label}} deve ser um inteiro maior ou igual a zero.',
});

const patch = post.fork(['name', 'grade', 'segment', 'shift', 'status', 'maxOccupancy'], (field) => field.optional())
  .min(1).messages({
    'object.min': 'Informe pelo menos um campo da turma para atualizar.',
  });

module.exports = { post, patch };
