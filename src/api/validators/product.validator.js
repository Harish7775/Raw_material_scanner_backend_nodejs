const Joi = require("joi");

const createProductSchema = Joi.object().keys({
  Name: Joi.string().required().error(new Error("Product Name is required")),
  ProductCode: Joi.string().required().error(new Error("Product code is required")),
  CategoryId: Joi.number().required().error(new Error("Id is inValid")),
  CompanyId: Joi.number().required().error(new Error("Id is inValid")),
  WeightInGrams: Joi.number().positive().optional(),
  HeightInCm: Joi.number().positive().optional(),
  WidthInCm: Joi.number().positive().optional(),
  VolumeInLiter: Joi.number().positive().optional(),
  Price: Joi.number().positive().required(),
  RewardPointValue: Joi.number().positive().optional(),
  DiscountPercentage: Joi.number().positive().optional(),
  SGSTPercentage: Joi.number().positive().optional(),
  CGSTPercentage: Joi.number().positive().optional(),
  IGSTPercentage: Joi.number().positive().optional(),
  IsActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object().keys({
    Name: Joi.string(),
    ProductCode: Joi.string(),
    CategoryId: Joi.number(),
    CompanyId: Joi.number(),
    WeightInGrams: Joi.number().min(0).optional(),
    HeightInCm: Joi.number().min(0).optional(),
    WidthInCm: Joi.number().min(0).optional(),
    VolumeInLiter: Joi.number().positive(),
    Price: Joi.number().positive(),
    RewardPointValue: Joi.number().min(0).optional(),
    DiscountPercentage: Joi.number().min(0).optional(),
    SGSTPercentage: Joi.number().min(0).optional(),
    CGSTPercentage: Joi.number().min(0).optional(),
    IGSTPercentage: Joi.number().min(0).optional(),
    IsActive: Joi.boolean().default(true),
  });

  const getAllProductSchema = Joi.object().keys({
    categoryIds: Joi.array().items(Joi.number().integer()),
    companyIds: Joi.array().items(Joi.number().integer()),
    productIds: Joi.array().items(Joi.number().integer()),
    sortBy: Joi.string().valid("Name", "Price", "createdAt").default("createdAt"),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    search: Joi.string().allow("").default(""),
    pagination: Joi.string().valid("true", "false").default("true"),
  });

module.exports = {
  createProductSchema,
  updateProductSchema,
  getAllProductSchema
};
