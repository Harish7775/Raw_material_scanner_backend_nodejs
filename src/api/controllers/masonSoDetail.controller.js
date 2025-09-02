const db = require("../../models");
const MasonSoDetail = db.MasonSoDetail;
const MasonSo = db.MasonSo;
const Users = db.Users;
const Product = db.Product;
const { Op } = require("sequelize");
const sendSms = require("../../helper/sendsms");
const { rewardPointsTemplate } = require("../../helper/smsTemplates");

exports.createMasonSoDetail = async (req, res) => {
  try {
    const { products, masonId } = req.body;

    const masonSo = await MasonSo.create({
      MasonId: masonId,
      CreatedBy: req.user.id,
      ModifiedBy: req.user.id,
    });

    const productIds = products.map((p) => p.productId);
    const productList = await Product.findAll({
      where: { ProductId: productIds },
    });

    let totalRewardPoint = 0;

    const masonSoDetails = products.map((product) => {
      const prod = productList.find((p) => p.ProductId === product.productId);
      const rewardPoints = product.quantity * parseFloat(prod?.RewardPointValue || 0);

      totalRewardPoint += rewardPoints;

      return {
        MasonSoId: masonSo.MasonSoId,
        ProductId: product.productId,
        Quantity: product.quantity,
        RewardPoints: rewardPoints,
        CreatedBy: req.user.id,
        ModifiedBy: req.user.id,
      };
    });

    await MasonSoDetail.bulkCreate(masonSoDetails);

    await MasonSo.update(
      { TotalRewardPoint: totalRewardPoint },
      { where: { MasonSoId: masonSo.MasonSoId } }
    );

    const user = await Users.findByPk(masonId, {
      attributes: ["FirstName", "Phone"],
    });

    const masonSos = await MasonSo.findAll({
      where: { MasonId: masonId },
      include: [
        {
          model: MasonSoDetail,
          attributes: ["RewardPoints"],
          as: "details",
        },
      ],
    });

    const totalRewardPoints = masonSos.reduce((sum, masonSo) => {
      const soRewardPoints = masonSo.details.reduce(
        (detailSum, detail) => detailSum + parseFloat(detail.RewardPoints),
        0
      );
      return sum + soRewardPoints;
    }, 0);

    const toMason = `+91${user.Phone}`;

    const messageMason = rewardPointsTemplate(totalRewardPoints);

    await Promise.all([sendSms(toMason, messageMason)]);

    return res.status(200).send({ success: true, message: "MassonSo Created Succssfully..!" });
  } catch (err) {
    console.error("Error creating MasonSoDetail:", err);
    return res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while creating the details.",
    });
  }
};

exports.getAllMasonSoDetails = async (req, res) => {
  try {
    const { fromDate, toDate, masonName, page = 1, limit = 10 } = req.query;

    const whereConditions = {};

    if (fromDate && !toDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(fromDate),
      };
    }

    if (!fromDate && toDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(new Date(toDate).setHours(29, 29, 59, 999)),
      };
    }

    if (fromDate && toDate) {
      whereConditions.createdAt = {
        [Op.between]: [
          new Date(fromDate),
          new Date(new Date(toDate).setHours(29, 29, 59, 999)),
        ],
      };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await MasonSo.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Users,
          as: "masonDetails",
          attributes: ["FirstName", "LastName"],
          where: masonName
            ? {
                [Op.or]: [
                  { FirstName: { [Op.like]: `%${masonName}%` } },
                  { LastName: { [Op.like]: `%${masonName}%` } },
                ],
              }
            : undefined,
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    // const data = rows.map((masonSo) => {
    //   const totalRewardPoints = masonSo.details.reduce(
    //     (sum, detail) => sum + parseFloat(detail.RewardPoints),
    //     0
    //   );
    //   return {
    //     ...masonSo.toJSON(),
    //     totalRewardPoints,
    //   };
    // });

    res.status(200).json({
      success: true,
      data: rows,
      totalItems: count,      
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error fetching MasonSoDetails:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching MasonSo details",
    });
  }
};

exports.getMasonSoDetailById = async (req, res) => {
  try {
    const { id } = req.params;

    const masonSo = await MasonSo.findOne({
      where: { MasonSoId: id },
      include: [
        {
          model: Users,
          as: "masonDetails",
          attributes: ["FirstName", "LastName"],
        },
        {
          model: MasonSoDetail,
          attributes: ["ProductId", "Quantity", "RewardPoints"],
          as: "details",
          include: [
            {
              model: Product,
              attributes: ["Name"],
            },
          ],
        },
      ],
    });

    if (!masonSo) {
      return res.status(404).json({
        success: false,
        message: "Mason SO not found",
      });
    }

    res.status(200).json({
      success: true,
      data: masonSo,
    });
  } catch (err) {
    console.error("Error fetching MasonSoDetail:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching MasonSo detail",
    });
  }
};

exports.getTotalRewardPointsForMason = async (req, res) => {
  try {
    const { masonId } = req.params;

    const masonSos = await MasonSo.findAll({
      where: { MasonId: masonId },
      include: [
        {
          model: MasonSoDetail,
          attributes: ["ProductId", "Quantity", "RewardPoints"],
          as: "details",
          include: [
            {
              model: Product,
              attributes: ["Name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalRewardPoints = masonSos.reduce((sum, masonSo) => {
      const soRewardPoints = masonSo.details.reduce(
        (detailSum, detail) => detailSum + parseFloat(detail.RewardPoints),
        0
      );
      return sum + soRewardPoints;
    }, 0);

    res.status(200).json({
      success: true,
      masonSos,
      totalRewardPoints,
    });
  } catch (err) {
    console.error("Error fetching total reward points:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching total reward points for Mason",
    });
  }
};

exports.getRewardHistory = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      search,
      page = 1,
      pageSize = 10,
      orderBy = "createdAt",
      order = "DESC",
    } = req.query;
    const masonId = req.user.id;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const whereDetail = { MasonId: masonId };

    if (fromDate || toDate) {
      whereDetail.createdAt = {};
      if (fromDate) {
        whereDetail.createdAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereDetail.createdAt[Op.lte] = new Date(toDate);
      }
    }

    const whereProduct = {};
    if (search) {
      whereProduct.Name = { [Op.like]: `%${search}%` };
    }

    const include = [
      {
        model: MasonSoDetail,
        attributes: [
          "Quantity",
          "RewardPoints",
        ],
        as: "details",
        include: [
          {
            model: Product,
            attributes: ["Name"],
            where: whereProduct,
          },
        ],
      },
    ];

    let orderClause = [[orderBy, order]];

    const { rows, count } = await MasonSo.findAndCountAll({
      where: whereDetail,
      include,
      order: orderClause,
      offset,
      limit: parseInt(pageSize),
      distinct: true,
      col: "MasonSoId",
    });

    if (rows.length === 0) {
      return res.status(500).json({
        success: false,
        data: [],
        message: "No Data Found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error("Reward History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};