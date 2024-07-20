const Joi = require("joi");

const createLedgerEntrySchema = Joi.object().keys({
  EntryType: Joi.string().valid("Credit", "Debit").required(),
  Amount: Joi.number().required().error(new Error("Amout is required..!")),
  Note: Joi.string().allow(""),
  RetailerUserId: Joi.number().required().error(new Error("Id is inValid")),
});

const updateLedgerEntrySchema = Joi.object().keys({
  EntryType: Joi.string().valid("Credit", "Debit"),
  Note: Joi.string().allow(""),
  Amount: Joi.number(),
});

const getRecordsSchema = Joi.object({
  page: Joi.number().integer().min(1).required(),
  pageSize: Joi.number().integer().min(1).required(),
  fromDate: Joi.string(),
  toDate: Joi.string(),
  search: Joi.string().allow(""),
  pagination: Joi.string()
});

module.exports = {
  createLedgerEntrySchema,
  updateLedgerEntrySchema,
  getRecordsSchema
};
