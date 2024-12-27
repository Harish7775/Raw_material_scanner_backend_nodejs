const db = require("../../models");
const Product = db.Product;
const Category = db.Category;
const Company = db.Company;
const CouponMaster = db.CouponMaster;
const Coupon = db.Coupon;

exports.getAllCouponMasters = async (req, res) => {
  try {
    const {
      // search = "",
      sortBy = "CouponMasterId",
      sortOrder = "DESC",
      page = 1,
      pageSize = 10,
      // companyIds = [],
      // categoryIds = [],
      // productIds = [],
      // productCode = "",
      // productName = "",
      // reedemed = false,
      // unReedemed = false,
      // fromDate = "",
      // toDate = "",
      // fromExpiryDate = "",
      // toExpiryDate = "",
      // fromRedeemDate = "",
      // toRedeemDate = "",
      // // masonsCoupon = [],
      // retailersCoupon = [],
      // flag = false,
    } = req.body;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // const startDate = moment().startOf("month").toDate();
    // const endDate = moment().endOf("month").toDate();

    const whereCondition = {
      //   ...(search && {
      //     CouponCode: {
      //       [Op.iLike]: `%${search}%`,
      //     },
      //   }),
      //   ...(companyIds.length > 0 && {
      //     "$Product.CompanyId$": {
      //       [Op.in]: companyIds,
      //     },
      //   }),
      //   ...(productIds.length > 0 && {
      //     "$Product.ProductId$": {
      //       [Op.in]: productIds,
      //     },
      //   }),
      //   ...(categoryIds.length > 0 && {
      //     "$Product.CategoryId$": {
      //       [Op.in]: categoryIds,
      //     },
      //   }),
      //   ...(productCode && {
      //     "$Product.ProductCode$": {
      //       [Op.like]: productCode,
      //     },
      //   }),
      //   ...(productName && {
      //     "$Product.Name$": {
      //       [Op.like]: productName,
      //     },
      //   }),
      //   ...(reedemed == true && {
      //     RedeemBy: {
      //       [Op.not]: null,
      //     },
      //   }),
      //   ...(reedemed == true &&
      //     flag == true && {
      //       RedeemBy: {
      //         [Op.not]: null,
      //       },
      //       RedeemDateTime: {
      //         [Op.between]: [startDate, endDate],
      //       },
      //     }),
      //   ...(unReedemed == true && {
      //     RedeemBy: {
      //       [Op.is]: null,
      //     },
      //   }),
      //   ...(fromDate &&
      //     toDate && {
      //       createdAt: {
      //         [Op.between]: [
      //           new Date(fromDate),
      //           new Date(new Date(toDate).setHours(29, 29, 59, 999)),
      //         ],
      //       },
      //     }),
      //   ...(fromExpiryDate &&
      //     toExpiryDate && {
      //       ExpiryDateTime: {
      //         [Op.between]: [
      //           new Date(fromExpiryDate),
      //           new Date(new Date(toExpiryDate).setHours(29, 29, 59, 999)),
      //         ],
      //       },
      //     }),
      //   ...(fromRedeemDate &&
      //     toRedeemDate && {
      //       RedeemDateTime: {
      //         [Op.between]: [
      //           new Date(fromRedeemDate),
      //           new Date(new Date(toRedeemDate).setHours(29, 29, 59, 999)),
      //         ],
      //       },
      //     }),
      //   // ...(masonsCoupon.length > 0 && {
      //   //   RedeemTo: {
      //   //     [Op.in]: masonsCoupon,
      //   //   },
      //   // }),
      //   ...(retailersCoupon.length > 0 && {
      //     RedeemBy: {
      //       [Op.in]: retailersCoupon,
      //     },
      //   }),
    };

    const couponMasters = await CouponMaster.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Product,
          attributes: ["Name"],
          include: [
            {
              model: Category,
              //as: 'category',
              attributes: ["Name"],
            },
            {
              model: Company,
              //as: 'company',
              attributes: ["Name"],
            },
          ],
        },
        // {
        //   model: User,
        //   as: "RedeemToUser",
        //   attributes: ["FirstName", "LastName"],
        // },
        // {
        //   model: User,
        //   as: "RedeemByUser",
        //   attributes: ["FirstName", "LastName"],
        // },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
      paranoid: true,
    });

    return res.status(200).json({
      success: true,
      coupons: couponMasters.rows,
      totalItems: couponMasters.count,
      totalPages: Math.ceil(couponMasters.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCouponMasterById = async (req, res) => {
  try {
    const id = req.params.id;
    const couponMaster = await CouponMaster.findOne({
      where: { CouponMasterId: id },
      include: [{ model: Product, attributes: ["Name", "Price"] }],
    });

    if (!couponMaster) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({ success: true, couponMaster });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCouponMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { ExpiryDateTime, Amount, ProductId } = req.body;

    if (ExpiryDateTime && new Date(ExpiryDateTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupons have already expired, so their expiry date cannot be extended.",
      });
    }

    const couponMaster = await CouponMaster.findByPk(id);

    if (!couponMaster) {
      return res.status(404).json({
        success: false,
        message: "CouponMaster not found.",
      });
    }

    const updatedData = {
      ExpiryDateTime: ExpiryDateTime || couponMaster.ExpiryDateTime,
      Amount: Amount || couponMaster.Amount,
      ProductId: ProductId || couponMaster.ProductId,
      ModifiedBy: req.user.id,
    };

    await CouponMaster.update(updatedData, { where: { CouponMasterId: id } });

    const updatedCouponData = {};
    if (ExpiryDateTime) updatedCouponData.ExpiryDateTime = ExpiryDateTime;
    if (Amount) updatedCouponData.Amount = Amount;
    if (ProductId) updatedCouponData.ProductId = ProductId;
    updatedCouponData.ModifiedBy = req.user.id;

    await Coupon.update(updatedCouponData, {
      where: { CouponMasterId: id },
    });

    const updatedCouponMaster = await CouponMaster.findByPk(id);

    return res.status(200).json({
      success: true,
      message: "CouponMaster and associated Coupons updated successfully.",
      data: updatedCouponMaster,
    });
  } catch (error) {
    console.error("Error updating CouponMaster and Coupons:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while updating CouponMaster.",
    });
  }
};
