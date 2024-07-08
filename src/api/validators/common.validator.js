const Joi = require("joi");

const idSchema = Joi.object({
  id: Joi.number().required().error(new Error("Id is inValid")),
});

const getRecordsSchema = Joi.object({
  page: Joi.number().integer().min(1).required(),
  pageSize: Joi.number().integer().min(1).required(),
  search: Joi.string().allow(""),
  pagination: Joi.string()
});

module.exports = {
  idSchema,
  getRecordsSchema
};