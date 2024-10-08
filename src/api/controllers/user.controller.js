const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const Users = db.Users;
const Coupon = db.Coupon;
const Company = db.Company;
const Product = db.Product;
const LedgerEntry = db.LedgerEntry;
const Role = db.Roles;
const Token = db.Token;
const RewardPoints = db.RewardPoints;
const { Op } = require("sequelize");
const moment = require("moment");
const crypto = require("crypto");
const sendMail = require("../../helper/sendMail");

exports.createUser = async (req, res) => {
  try {
    const role = await Role.findOne({ where: { Name: req.body.Role } });

    let hashedPassword;

    if (role.Name == "Admin") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(req.body.Password, salt);
    }

    const user = {
      FirstName: req.body.FirstName,
      LastName: req.body.LastName,
      Email: req.body.Email,
      Phone: req.body.Phone,
      Password: hashedPassword,
      RoleId: role.RoleId,
      Address: req.body.Address,
      ShopName: req.body.ShopName,
      CreatedBy: req?.user?.id,
      ModifiedBy: req?.user?.id,
    };

    const data = await Users.create(user);
    return res.status(200).send({ success: true, data });
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { Phone, Password } = req.body;

    const admin = await Users.findOne({ where: { Phone, IsActive: true } });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const RoleId = admin.RoleId;
    const role = await db.Roles.findOne({ where: { RoleId: RoleId } });

    if (role.Name == "Admin") {
      const isPasswordValid = await bcrypt.compare(Password, admin.Password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });
      }
    }

    const token = jwt.sign(
      { role: role.Name, email: admin.Email, id: admin.UserId },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    return res.status(200).json({ success: true, admin, token });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      RoleId,
      Type,
      fromDate,
      toDate,
      isActive,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    search = search || "";

    const offset = (page - 1) * limit;

    const order = [[sortBy, sortOrder]];

    const where = {
      [Op.or]: [
        {
          FirstName: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          LastName: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ],
    };
    if (Type) {
      const roles = await Role.findOne({
        where: {
          Name: Type,
        },
      });
      where.RoleId = roles.RoleId;
    }

    if (isActive) {
      where.IsActive = isActive;
    }

    if (RoleId) {
      where.RoleId = RoleId;
    }

    if (fromDate && toDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(fromDate),
          new Date(new Date(toDate).setHours(23, 59, 59, 999)),
        ],
      };
    }

    const users = await Users.findAndCountAll({
      where,
      order,
      limit,
      offset,
      RoleId,
      attributes: {
        exclude: ["Password"],
      },
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["Name"],
        },
      ],
    });

    let usersWithMasonCount;
    if (Type == "Retailer") {
      const roles = await Role.findOne({
        where: {
          Name: "Mason",
        },
      });
      const userIds = users.rows.map((user) => user.UserId);
      const masonCountData = await Users.findAll({
        attributes: [
          "CreatedBy",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("UserId")), "masonCount"],
        ],
        where: {
          RoleId: {
            [Op.eq]: roles.RoleId,
          },
          CreatedBy: {
            [Op.in]: userIds,
          },
        },
        group: ["CreatedBy"],
      });

      const masonCountMap = masonCountData.reduce((acc, item) => {
        acc[item.CreatedBy] = item.getDataValue("masonCount");
        return acc;
      }, {});

      const rewardPointsData = await RewardPoints.findAll({
        attributes: [
          "RetailerId",
          [
            db.Sequelize.fn("SUM", db.Sequelize.col("RewardPointValue")),
            "totalRewardPoints",
          ],
        ],
        where: {
          RetailerId: { [Op.in]: userIds },
        },
        group: ["RetailerId"],
      });

      const rewardPointsMap = rewardPointsData.reduce((acc, item) => {
        acc[item.RetailerId] = item.getDataValue("totalRewardPoints") || 0;
        return acc;
      }, {});

      usersWithMasonCount = users.rows.map((user) => {
        const userJson = user.toJSON();
        userJson.masonCount = masonCountMap[user.UserId] || 0;
        userJson.totalRewardPoints = rewardPointsMap[user.UserId] || 0;
        return userJson;
      });
    }

    const totalPages = Math.ceil(users.count / limit);

    return res.status(200).json({
      success: true,
      users: Type == "Retailer" ? usersWithMasonCount : users.rows,
      totalPages,
      currentPage: page,
      totalItems: users.count,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await Users.findByPk(id, {
      attributes: [
        "FirstName",
        "LastName",
        "Email",
        "Phone",
        "Address",
        "ShopName",
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const createdUsers = await Users.findAll({
      where: { CreatedBy: id },
    });

    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const scannedQRcode = await Coupon.count({
      where: {
        RedeemBy: id,
        RedeemDateTime: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    const response = {
      ...user.toJSON(),
      createdUsers,
      scannedQRcode,
    };

    return res.status(200).json({ success: true, response });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await Users.findByPk(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    req.body.ModifiedBy = req.user.id;
    await user.update(req.body);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Users.findByPk(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.destroy();

    await LedgerEntry.destroy({
      where: { RetailerUserId: userId },
    });

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { Email } = req.body;

    const user = await Users.findOne({ where: { Email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let token = await Token.findOne({ where: { UserId: user.UserId } });

    if (!token) {
      const tokenValue = crypto.randomBytes(32).toString("hex");
      token = await Token.create({
        UserId: user.UserId,
        Token: tokenValue,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });
    } else {
      token.Token = crypto.randomBytes(32).toString("hex");
      token.expiresAt = new Date(Date.now() + 3600 * 1000);
      await token.save();
    }

    const link = `${process.env.BASE_URL}/resetPassword/${user.UserId}/${token.Token}`;

    await sendMail(user.Email, "Password reset", link);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email account",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await Users.findOne({ where: { UserId: req.params.UserId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid link or expired" });
    }

    const token = await Token.findOne({
      where: { UserId: user.UserId, Token: req.params.Token },
    });
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid link or expired" });
    }

    if (token.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid link or expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.Password = hashedPassword;
    await user.save();

    await token.destroy();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getRetailerDetailById = async (req, res) => {
  try {
    const id = req.params.id;
    const { sortBy = "createdAt", sortOrder = "DESC", search } = req.query;

    const ledgerEntries = await LedgerEntry.findAll({
      where: { RetailerUserId: id },
      include: [
        {
          model: Users,
          as: "UserDetail",
          attributes: ["FirstName", "LastName"],
        },
      ],
    });

    const masonWhereCondition = {
      CreatedBy: id,
      ...(search && {
        [Op.or]: [
          { FirstName: { [Op.iLike]: `%${search}%` } },
          { LastName: { [Op.iLike]: `%${search}%` } },
        ],
      }),
    };

    const relatedMasons = await Users.findAndCountAll({
      where: masonWhereCondition,
      include: [
        {
          model: Coupon,
          as: "ScannedCoupons",
          attributes: ["CouponCode", "Amount", "RedeemDateTime"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    const response = {
      ledgerEntries: ledgerEntries,
      relatedMasons: relatedMasons.rows.map((mason) => ({
        ...mason.toJSON(),
        ScannedCoupons: mason.ScannedCoupons.map((coupon) => coupon.toJSON()),
      })),
      totalMasons: relatedMasons.count,
    };

    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const startDate = moment().startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();

    const retailerRole = await Role.findOne({ where: { Name: "Retailer" } });
    const masonRole = await Role.findOne({ where: { Name: "Mason" } });

    const retailerCount = await Users.count({
      where: {
        RoleId: retailerRole.RoleId,
      },
    });
    const companyCount = await Company.count({
      where: {
        IsActive: true,
      },
    });
    const productCount = await Product.count({
      where: {
        IsActive: true,
      },
    });
    const masonCount = await Users.count({
      where: {
        RoleId: masonRole.RoleId,
      },
    });

    const scannedCouponsCount = await Coupon.count({
      where: {
        RedeemDateTime: {
          [Op.between]: [startDate, endDate],
        },
        RedeemTo: {
          [Op.not]: null,
        },
      },
    });

    const scannedCouponsAmount = await Coupon.sum("Amount", {
      where: {
        RedeemDateTime: {
          [Op.between]: [startDate, endDate],
        },
        RedeemTo: {
          [Op.not]: null,
        },
      },
    });

    const response = {
      success: true,
      data: {
        retailerCount,
        companyCount,
        masonCount,
        productCount,
        scannedCouponsCount,
        scannedCouponsAmount: scannedCouponsAmount || 0,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { Phone, oldPassword, newPassword } = req.body;

    if (!Phone || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await Users.findOne({ where: { Phone } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found..!" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.Password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getRetailerStats = async (req, res) => {
  try {
    const retailerId = req.params.id;
    const startDate = moment().startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();

    const ledgerQuery = {
      where: {
        RetailerUserId: retailerId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const [
      billedAmount,
      paidAmount,
      scannedQRCount,
      scannedQRAmount,
      totalRewardPoints,
    ] = await Promise.all([
      LedgerEntry.sum("Amount", {
        ...ledgerQuery,
        where: { ...ledgerQuery.where, EntryType: "Debit" },
      }),
      LedgerEntry.sum("Amount", {
        ...ledgerQuery,
        where: { ...ledgerQuery.where, EntryType: "Credit" },
      }),
      Coupon.count({
        where: {
          RedeemDateTime: {
            [Op.between]: [startDate, endDate],
          },
          RedeemBy: retailerId,
        },
      }),
      Coupon.sum("Amount", {
        where: {
          RedeemDateTime: {
            [Op.between]: [startDate, endDate],
          },
          RedeemBy: retailerId,
        },
      }),
      RewardPoints.sum("RewardPointValue", {
        where: {
          RetailerId: retailerId,
        },
      }),
    ]);

    const outstandingAmount = (billedAmount || 0) - (paidAmount || 0);

    const response = {
      success: true,
      data: {
        billedAmount: billedAmount || 0,
        outstandingAmount: outstandingAmount || 0,
        scannedQRAmount: scannedQRAmount || 0,
        scannedQRCount: scannedQRCount || 0,
        totalRewardPoints: totalRewardPoints,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
