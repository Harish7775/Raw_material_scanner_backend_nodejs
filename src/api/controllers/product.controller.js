const db = require("../../models");
const Product = db.Product;
const Coupon = db.Coupon;
const Category = db.Category;
const Company = db.Company;

exports.createProduct = async (req, res) => {
  try {
    req.body.CreatedBy = req.user.id;
    req.body.ModifiedBy = req.user.id;
    const inputName = req.body.Name.trim();

    const existingProduct = await Product.findOne({
      where: db.Sequelize.where(
        db.Sequelize.fn("TRIM", db.Sequelize.col("Name")),
        inputName
      ),
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product Name already exists",
      });
    }

    const product = await Product.create({
      ...req.body,
      Name: inputName,
    });

    return res.status(200).json({ success: true, product });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message:
          error.errors[0]?.message ||
          "A product with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while creating the product.",
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    let {
      categoryIds = [],
      companyIds = [],
      productIds = [],
      sortBy = "createdAt",
      sortOrder = "DESC",
      page = 1,
      limit = 10,
      search = "",
      pagination = "true",
    } = req.body;

    if (pagination === "false") {
      const data = await Product.findAll({
        where: {
          IsActive: true,
        },
        include: [
          { model: Category, attributes: ["Name"] },
          { model: Company, attributes: ["Name"] },
        ],
      });
      return res.status(200).json({ success: true, data });
    }

    const offset = (page - 1) * limit;

    const whereCondition = {
      ...(search && {
        Name: {
          [db.Sequelize.Op.like]: `%${search}%`,
        },
      }),
      ...(categoryIds.length > 0 && {
        CategoryId: {
          [db.Sequelize.Op.in]: categoryIds,
        },
      }),
      ...(companyIds.length > 0 && {
        CompanyId: {
          [db.Sequelize.Op.in]: companyIds,
        },
      }),
      ...(productIds.length > 0 && {
        ProductId: {
          [db.Sequelize.Op.in]: productIds,
        },
      }),
    };

    const queryOptions = {
      where: whereCondition,
      include: [
        { model: Category, attributes: ["Name"] },
        { model: Company, attributes: ["Name"] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
    };

    const products = await Product.findAndCountAll({
      ...queryOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      products: products.rows,
      totalItems: products.count,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({
      where: { ProductId: id },
      include: [
        { model: Category, attributes: ["Name"] },
        { model: Company, attributes: ["Name"] },
      ],
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    req.body.ModifiedBy = req.user.id;

    const [updated] = await Product.update(req.body, {
      where: { ProductId: id },
    });
    if (updated) {
      const updatedProduct = await Product.findOne({
        where: { ProductId: id },
      });
      return res.status(200).json({ success: true, product: updatedProduct });
    }
    throw new Error("Product not found");
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while update the product.",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const result = await Product.destroy({
      where: { ProductId: id },
      force: true,
    });

    if (result) {
      const coupon = await Coupon.destroy({ where: { ProductId: id } });
      return res
        .status(200)
        .json({ success: true, message: "Product deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
