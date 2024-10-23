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
      const rewardPoints = parseFloat(prod?.RewardPointValue || 0);

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

    return res.status(201).send({ success: true, data: masonSoDetails });
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
    const { fromDate, toDate, masonId, page = 1, limit = 10 } = req.query;

    const whereConditions = {};

    if (masonId) {
      whereConditions.MasonId = masonId;
    }

    if (fromDate && toDate) {
      whereConditions.createdAt = {
        [Op.between]: [
          new Date(fromDate),
          new Date(new Date(toDate).setHours(23, 59, 59, 999)),
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
      total: count,
      data: rows,
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

    res.status(200).json({
      success: true,
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

exports.deleteMasonSo = async (req, res) => {
  try {
    const { masonSoId } = req.params;

    // Check if the MasonSo exists
    const masonSo = await MasonSo.findByPk(masonSoId);
    if (!masonSo) {
      return res
        .status(404)
        .send({ success: false, message: "MasonSo not found" });
    }

    await MasonSoDetail.destroy({
      where: { MasonSoId: masonSoId },
    });

    // Delete the MasonSo itself
    await MasonSo.destroy({
      where: { MasonSoId: masonSoId },
    });

    return res.status(200).send({
      success: true,
      message: "MasonSo and related details deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting MasonSo and MasonSoDetails:", error);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};
