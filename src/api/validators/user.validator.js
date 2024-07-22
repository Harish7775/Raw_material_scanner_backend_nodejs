const Joi = require("joi");

const createUserSchema = Joi.object().keys({
  FirstName: Joi.string().required().error(new Error("First Name is required")),
  LastName: Joi.string().optional(),
  ShopName: Joi.string().optional(),
  Address: Joi.string().optional(),
  Email: Joi.string()
    .email().optional().allow(""),
  Phone: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .length(10)
    .error(new Error("Phone Number is required")),
  Password: Joi.string().optional().allow(""),
  IsActive: Joi.boolean().default(true).optional(),
  Role: Joi.string().valid("Retailer", "Mason", "Admin").required().error(new Error("Role is required")),
});

const updateUserSchema = Joi.object().keys({
  FirstName: Joi.string(),
  LastName: Joi.string(),
  Email: Joi.string().email().optional().allow(""),
  ShopName: Joi.string().optional(),
  Address: Joi.string().optional(),
  Password: Joi.string(),
  IsActive: Joi.boolean(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
