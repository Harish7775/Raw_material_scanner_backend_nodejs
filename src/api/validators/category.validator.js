const Joi = require("joi");

const createCategorySchema = Joi.object().keys({
  Name: Joi.string().required().error(new Error("Category Name is required")),
  IsActive: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object().keys({
    Name: Joi.string(),
    IsActive: Joi.boolean().default(true),
  });

module.exports = {
  createCategorySchema,
  updateCategorySchema
};
