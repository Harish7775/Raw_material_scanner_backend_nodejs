const db = require("../../models");
const Coupon = db.Coupon;
const Product = db.Product;
const Role = db.Roles;
const Category = db.Category;
const Company = db.Company;
const User = db.Users;
const { Op } = require("sequelize");
const moment = require("moment");
const sendSms = require("../../helper/sendsms");

exports.createCoupon = async (req, res) => {
  try {
    const { quantity } = req.query;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charactersLength = characters.length;
    const length = 10;
    for (let i = 1; i <= quantity; i++) {
      const CouponCode = Array.from({ length }, () =>
        characters.charAt(Math.floor(Math.random() * charactersLength))
      ).join("");
      req.body.CreatedBy = req.user.id;
      req.body.ModifiedBy = req.user.id;
      req.body.CouponCode = CouponCode;
      const newCoupon = await Coupon.create(req.body);
    }
    return res
      .status(201)
      .json({ success: true, message: "Coupon Generated Successfully..!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const {
      search = "",
      sortBy = "CouponId",
      sortOrder = "DESC",
      page = 1,
      pageSize = 10,
      companyIds = [],
      categoryIds = [],
      productIds = [],
      productCode = "",
      productName = "",
      reedemed = false,
      unReedemed = false,
      fromDate = "",
      toDate = "",
      fromExpiryDate = "",
      toExpiryDate = "",
      masonsCoupon = [],
      retailersCoupon = [],
      flag = false
    } = req.body;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const startDate = moment().startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();

    const whereCondition = {
      ...(search && {
        CouponCode: {
          [Op.iLike]: `%${search}%`,
        },
      }),
      ...(companyIds.length > 0 && {
        "$Product.CompanyId$": {
          [Op.in]: companyIds,
        },
      }),
      ...(productIds.length > 0 && {
        "$Product.ProductId$": {
          [Op.in]: productIds,
        },
      }),
      ...(categoryIds.length > 0 && {
        "$Product.CategoryId$": {
          [Op.in]: categoryIds,
        },
      }),
      ...(productCode && {
        "$Product.ProductCode$": {
          [Op.like]: productCode,
        },
      }),
      ...(productName && {
        "$Product.Name$": {
          [Op.like]: productName,
        },
      }),
      ...(reedemed == true && {
        RedeemBy: {
          [Op.not]: null,
        },
      }),
      ...(reedemed == true && flag == true && {
        RedeemBy: {
          [Op.not]: null,
        },
        RedeemDateTime: {
          [Op.between]: [startDate, endDate],
        },
      }),
      ...(unReedemed == true && {
        RedeemBy: {
          [Op.is]: null,
        },
      }),
      ...(fromDate &&
        toDate && {
          createdAt: {
            [Op.between]: [new Date(fromDate), new Date(toDate)],
          },
        }),
      ...(fromExpiryDate &&
        toExpiryDate && {
          ExpiryDateTime: {
            [Op.between]: [new Date(fromExpiryDate), new Date(toExpiryDate)],
          },
        }),
      ...(masonsCoupon.length > 0 && {
        RedeemTo: {
          [Op.in]: masonsCoupon,
        },
      }),
      ...(retailersCoupon.length > 0 && {
        RedeemBy: {
          [Op.in]: retailersCoupon,
        },
      }),
    };

    const coupons = await Coupon.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Product,
          attributes: ["Name"],
          include: [
            {
              model: Category,
              //as: 'category',
              attributes: ["Name"], // Specify the attributes you need from Category
            },
            {
              model: Company,
              //as: 'company',
              attributes: ["Name"], // Specify the attributes you need from Company
            },
          ],
        },
        {
          model: User,
          as: "RedeemToUser",
          attributes: ["FirstName", "LastName"],
        },
        {
          model: User,
          as: "RedeemByUser",
          attributes: ["FirstName", "LastName"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
      paranoid: true,
    });

    return res.status(200).json({
      success: true,
      coupons: coupons.rows,
      totalItems: coupons.count,
      totalPages: Math.ceil(coupons.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findOne({
      where: { CouponId: id },
      include: [{ model: Product, attributes: ["Name", "Price"] }],
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    req.body.ModifiedBy = req.user.id;
    const updateData = req.body;

    const coupon = await Coupon.findOne({
      where: { CouponId: id },
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.RedeemBy !== null) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has already been redeemed" });
    }

    const currentDateTime = new Date();
    if (coupon.ExpiryDateTime < currentDateTime) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired" });
    }

    const [updated] = await Coupon.update(updateData, {
      where: { CouponId: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (req.body.RedeemBy && req.body.RedeemTo) {
      const user = await User.findByPk(req.body.RedeemTo);
      const to = `+91${user.Phone}`;
      const message = `Hi ${user.FirstName}, Your coupon has been redeemed successfully..!`;
      await sendSms(to, message);
    }

    return res
      .status(200)
      .json({ success: true, message: "Coupon updated successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    await coupon.destroy();
    return res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Coupon.findAll({
      where: { RedeemBy: id },
      include: [
        {
          model: Product,
          as: "Product",
        },
      ],
    });

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No coupons found for this user." });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCouponByRole = async (req, res) => {
  try {
    const name = req.params.name;

    const role = await Role.findOne({ where: { Name: name } });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    const roleId = role.RoleId;

    const users = await User.findAll({
      where: { RoleId: roleId },
      attributes: ["UserId"],
    });

    const userIds = users.map((user) => user.UserId);

    let whereCondition = {};

    if (role.Name === "Retailer") {
      whereCondition = {
        RedeemBy: {
          [Op.in]: userIds,
        },
      };
    } else if (role.Name === "Mason") {
      whereCondition = {
        RedeemTo: {
          [Op.in]: userIds,
        },
      };
    }

    const coupons = await Coupon.findAll({
      where: whereCondition,
    });

    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getQrCodeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fromDate,
      toDate,
      fromAmount,
      toAmount,
      masonid,
      amount,
      sortBy = "RedeemDateTime",
      sortOrder = "DESC",
      page = 1,
      pageSize = 10
    } = req.body;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const whereCondition = { RedeemBy: id };

    if (fromDate && toDate) {
      whereCondition.RedeemDateTime = {
        [Op.between]: [
          new Date(fromDate),
          new Date(new Date(toDate).setHours(23, 59, 59, 999)),
        ],
      };
    }

    if (fromAmount && toAmount) {
      whereCondition.Amount = {
        [Op.between]: [fromAmount, toAmount],
      };
    }

    if (amount) {
      whereCondition.Amount = {
        [Op.lte]: amount,
      };
    }

    if (masonid) {
      whereCondition.RedeemTo = masonid;
    }

    const includeCondition = [
      {
        model: User,
        as: "RedeemToUser",
        attributes: ["FirstName", "LastName", "Phone"],
        where: {},
      },
      {
        model: Product,
        attributes: ["Name", "Price", "WeightInGrams"],
        include: [
          {
            model: Company,
            attributes: ["Name"],
          },
        ],
      },
    ];

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereCondition,
      attributes: ["Amount", "RedeemDateTime", "RedeemTo", "CouponCode", "CouponId"],
      include: includeCondition,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
    });

    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: "No coupons found for this user...!",
      });
    }

    const response = coupons.map((coupon) => ({
      Amount: coupon.Amount,
      RedeemDateTime: coupon.RedeemDateTime,
      couponCode: coupon.CouponCode,
      CouponId: coupon.CouponId,
      Mason_Name: {
        name: coupon.RedeemToUser.FirstName,
        lastname: coupon.RedeemToUser.LastName,
        phone: coupon.RedeemToUser.Phone,
      },
      Product_Name: {
        name: coupon.Product.Name,
        price: coupon.Product.Price,
        weight: coupon.Product.WeightInGrams,
        companyName: coupon.Product.Company.Name,
      },
    }));

    return res.status(200).json({
      success: true,
      response,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getCouponByCouponCode = async (req, res) => {
  try {
    const couponCode = req.params.couponCode;

    const coupon = await Coupon.findOne({
      where: { CouponCode: couponCode },
      include: [
        {
          model: Product,
          as: "Product",
        },
      ],
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
