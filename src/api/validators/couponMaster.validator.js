const Joi = require("joi");

const updateCouponMasterSchema = Joi.object().keys({
  ProductId: Joi.number(),
  ExpiryDateTime: Joi.date(),
  Amount: Joi.number().positive(),
});

module.exports = {
  updateCouponMasterSchema,
};
