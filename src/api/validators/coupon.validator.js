const Joi = require("joi");

const createCouponSchema = Joi.object().keys({
    CouponCode: Joi.string(),
    ProductId: Joi.number().required().error(new Error("Id is inValid")),
    ExpiryDateTime: Joi.date().required().error(new Error("Expiry Date is required")),
    Amount: Joi.number().positive().required().error(new Error("Amount is required")),
    // RedeemTo: Joi.number().optional(),
    RedeemBy: Joi.number().optional(),
    RedeemDateTime: Joi.date().optional(),
    IsActive: Joi.boolean().default(true),
});

const updateCouponSchema = Joi.object().keys({
    CouponCode: Joi.string(),
    ProductId: Joi.number(),
    ExpiryDateTime: Joi.date(),
    Amount: Joi.number().positive(),
    // RedeemTo: Joi.number().optional(),
    RedeemBy: Joi.number().optional(),
    RedeemDateTime: Joi.date().optional(),
    IsActive: Joi.boolean().default(true),
    Paid: Joi.boolean().default(false),
});

const getRoleByCouponSchema = Joi.object().keys({
  name: Joi.string().valid("Retailer", "Mason").required()
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  getRoleByCouponSchema
};
