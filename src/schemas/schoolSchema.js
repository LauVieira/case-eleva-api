const Joi = require('joi');

const post = Joi.object({
  sectorId: Joi.number().required(),
  name: Joi.string().required(),
  address: Joi.string().required(),
  headteacher: Joi.string().required(),
  phone: Joi.string().required(),
});

module.exports = {
  post
};
