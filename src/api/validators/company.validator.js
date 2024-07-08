const Joi = require("joi");

const createCompanySchema = Joi.object().keys({
  Name: Joi.string().required().error(new Error("Company Name is required")),
  IsActive: Joi.boolean().default(true),
});

const updateCompanySchema = Joi.object().keys({
    Name: Joi.string(),
    IsActive: Joi.boolean().default(true),
  });

module.exports = {
  createCompanySchema,
  updateCompanySchema
};
