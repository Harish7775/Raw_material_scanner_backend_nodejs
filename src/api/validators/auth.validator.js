const Joi = require("joi");

const loginSchema = Joi.object().keys({
  Phone: Joi.string()
    .required()
    .error(new Error("Mobile number is required and should be 10 digits")),
  Password: Joi.string(),
});
const passwordSchema = Joi.object().keys({
  OldPassword: Joi.string()
    .required()
    .error(new Error("Old Password is required")),
  NewPassword: Joi.string()
    .required()
    .error(new Error("New Password is required")),
});

const forgetSchema = Joi.object().keys({
  Mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .error(new Error("Mobile number is required and should be 10 digits")),
  NewPassword: Joi.string()
    .required()
    .error(new Error(" New Password is required")),
});

module.exports = {
  passwordSchema,
  loginSchema,  
  forgetSchema
};
