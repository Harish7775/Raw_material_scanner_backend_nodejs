const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const Users = db.Users;
const Coupon = db.Coupon;
const LedgerEntry = db.LedgerEntry;
const Role = db.Roles;
const Token = db.Token;
const { Op } = require("sequelize");
const moment = require("moment");
const crypto = require("crypto");
const sendMail = require("../../helper/sendMail");

exports.createUser = async (req, res) => {
  try {
    const role = await Role.findOne({ where: { Name: req.body.Role } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.Password, salt);

    const user = {
      FirstName: req.body.FirstName,
      LastName: req.body.LastName,
      Email: req.body.Email,
      Phone: req.body.Phone,
      Password: hashedPassword,
      RoleId: role.RoleId,
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

    const admin = await Users.findOne({ where: { Phone } });
    const RoleId = admin.RoleId;
    const role = await db.Roles.findOne({ where: { RoleId: RoleId } });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

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
    if (RoleId) {
      where.RoleId = RoleId;
    }

    const users = await Users.findAndCountAll({
      where,
      order,
      limit,
      offset,
      RoleId,
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["Name"],
        },
      ],
    });

    const totalPages = Math.ceil(users.count / limit);

    return res.status(200).json({
      success: true,
      users: users.rows,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await Users.findByPk(id, {
      attributes: ["FirstName", "LastName", "Email", "Phone"],
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

    const deleted = await LedgerEntry.destroy({
      where: { UserId: userId },
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

    const relatedMasons = await Users.findAll({
      where: { CreatedBy: id },
      include: [
        {
          model: Coupon,
          as: "ScannedCoupons",
          attributes: ["CouponCode", "Amount", "RedeemDateTime"],
        },
      ],
    });

    const response = {
      ledgerEntries: ledgerEntries,
      relatedMasons: relatedMasons.map((mason) => ({
        ...mason.toJSON(),
        ScannedCoupons: mason.ScannedCoupons.map((coupon) => coupon.toJSON()),
      })),
    };

    return res.status(200).json({ success: true, response });
  } catch (error) {
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
        masonCount,
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

    const [billedAmount, paidAmount, scannedQRCount, scannedQRAmount] =
      await Promise.all([
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
      ]);

    const outstandingAmount = (billedAmount || 0) - (paidAmount || 0);

    const response = {
      success: true,
      data: {
        billedAmount: billedAmount || 0,
        outstandingAmount: outstandingAmount || 0,
        scannedQRAmount: scannedQRAmount || 0,
        scannedQRCount: scannedQRCount || 0,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

