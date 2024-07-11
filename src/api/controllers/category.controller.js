//const Category = require("../../models/category.model");
const db = require("../../models");
const Category = db.Category;
const Product = db.Product;

exports.createCategory = async (req, res) => {
  try {
    req.body.CreatedBy = req.user.id;
    req.body.ModifiedBy = req.user.id;
    const data = await Category.create(req.body);
    return res.status(201).send({ success: true, data });
  } catch (err) {
    return res
      .status(500)
      .send({
        success: false,
        message:
          err.message || "Some error occurred while creating the Category.",
      });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const {
      search = "",
      sortBy = "CategoryId",
      sortOrder = "DESC",
      page = 1,
      pageSize = 10,
      pagination = "true",
    } = req.query;

    if (pagination == "false") {
      const data = await Category.findAll({
        where: {
          IsActive: true,
        },
      });
      return res.status(200).json({ success: true, data });
    }
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const whereCondition = {
      Name: {
        [db.Sequelize.Op.iLike]: `%${search}%`,
      },
    };

    const categories = await Category.findAndCountAll({
      where: whereCondition,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
      paranoid: true,
    });

    return res.status(200).json({
      success: true,
      categories: categories.rows,
      totalItems: categories.count,
      totalPages: Math.ceil(categories.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findOne({
      where: { CategoryId: categoryId },
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { Name, IsActive } = req.body;
    const ModifiedBy = req.user.id;
    const [updated] = await Category.update(
      { Name, IsActive, ModifiedBy, ModifiedDate: new Date() },
      { where: { CategoryId: categoryId } }
    );

    if (updated) {
      const updateCategory = await Category.findOne({
        where: { CategoryId: categoryId },
      });
      return res.status(200).json({ success: true, category: updateCategory });
    }

    throw new Error("Category not found");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Category.destroy({ where: { CategoryId: id } });

    if (result) {
      const product = await Product.destroy({ where: { CategoryId: id } });
      return res
        .status(200)
        .json({ success: true, message: "Category deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
