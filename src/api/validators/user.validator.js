const Joi = require("joi");

const createUserSchema = Joi.object().keys({
  FirstName: Joi.string().required().error(new Error("First Name is required")),
  LastName: Joi.string().optional(),
  Email: Joi.string()
    .email(),
  Phone: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .length(10)
    .error(new Error("Phone Number is required")),
  Password: Joi.string().required(),
  IsActive: Joi.boolean().default(true).optional(),
  Role: Joi.string().valid("Retailer", "Mason").required().error(new Error("Role is required")),
});

const updateUserSchema = Joi.object().keys({
  FirstName: Joi.string(),
  LastName: Joi.string(),
  Email: Joi.string().email(),
  Password: Joi.string(),
  IsActive: Joi.boolean(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
