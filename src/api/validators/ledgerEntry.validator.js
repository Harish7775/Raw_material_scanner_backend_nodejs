const Joi = require("joi");

const createLedgerEntrySchema = Joi.object().keys({
  EntryType: Joi.string().valid("Credit", "Debit").required(),
  Amount: Joi.number().required().error(new Error("Amout is required..!")),
  UserId: Joi.number().required().error(new Error("Id is inValid")),
});

const updateLedgerEntrySchema = Joi.object().keys({
  EntryType: Joi.string().valid("Credit", "Debit"),
  Amount: Joi.number(),
});

module.exports = {
  createLedgerEntrySchema,
  updateLedgerEntrySchema,
};
