const Joi = require("joi");

const createMasonSoDetailSchema = Joi.object().keys({
  masonId: Joi.number().required(),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .required(),
});

const masonIdSchema = Joi.object({
    masonId: Joi.number().required().error(new Error("Id is inValid")),
  });

module.exports = {
  createMasonSoDetailSchema,
  masonIdSchema
};
