const db = require("../../models");
const Company = db.Company;
const Product = db.Product;

exports.createCompany = async (req, res) => {
  try {
    req.body.CreatedBy = req.user.id;
    req.body.ModifiedBy = req.user.id;

    const data = await Company.create(req.body);
    return res.status(200).send({ success: true, data });
  } catch (err) {
    return res
      .status(500)
      .send({
        success: false,
        message:
          err.message || "Some error occurred while creating the Company.",
      });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "CompanyId",
      sortOrder = "DESC",
      search = "",
      pagination = "true",
    } = req.query;

    if (pagination == "false") {
      const data = await Company.findAll({
        where: {
          IsActive: true,
        },
      });
      return res.status(200).json({ success: true, data });
    }

    const offset = (page - 1) * limit;

    const whereCondition = {
      Name: {
        [db.Sequelize.Op.iLike]: `%${search}%`,
      },
    };

    const companies = await Company.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    return res.status(200).json({
      success: true,
      companies: companies.rows,
      totalItems: companies.count,
      totalPages: Math.ceil(companies.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;
    const company = await Company.findOne({
      where: { CompanyId: id },
    });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }
    return res.status(200).json({ success: true, company });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const id = req.params.id;
    const { Name, IsActive } = req.body;
    const ModifiedBy = req.user.id;
    const [updated] = await Company.update(
      { Name, IsActive, ModifiedBy, ModifiedDate: new Date() },
      { where: { CompanyId: id } }
    );
    if (updated) {
      const updatedCompany = await Company.findOne({
        where: { CompanyId: id },
      });
      return res.status(200).json({ success: true, company: updatedCompany });
    }
    throw new Error("Company not found");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Company.destroy({ where: { CompanyId: id } });

    if (result) {
      const product = await Product.destroy({ where: { CompanyId: id } });
      return res
        .status(200)
        .json({ success: true, message: "Company deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
