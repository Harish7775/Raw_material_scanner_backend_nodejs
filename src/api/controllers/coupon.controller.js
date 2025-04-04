const db = require("../../models");
const Coupon = db.Coupon;
const Product = db.Product;
const Role = db.Roles;
const Category = db.Category;
const Company = db.Company;
const User = db.Users;
const CouponMaster = db.CouponMaster;
const LedgerEntry = db.LedgerEntry;
const { Op } = require("sequelize");
const moment = require("moment");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sendSms = require("../../helper/sendsms");
const { redeemAmountTemplate } = require("../../helper/smsTemplates");

exports.createCoupon = async (req, res) => {
  try {
    const { ProductId, ExpiryDateTime, Amount, Quantity } = req.body;
    const userId = req.user.id;
    const timestamp = Date.now();
    const pdfFileName = `coupons_${timestamp}.pdf`;
    const pdfPath = path.join(__dirname, "../../../pdf", pdfFileName);

    const couponMaster = await CouponMaster.create({
      ProductId,
      ExpiryDateTime,
      Amount,
      Quantity,
      FileName: pdfFileName,
      CreatedBy: userId,
      ModifiedBy: userId,
    });

    const couponMasterId = couponMaster.CouponMasterId;

    const totalCouponsForPDF = Quantity * 2;

    const totalCouponsForDB = Quantity;

    const doc = new PDFDocument({ size: "A3", margin: 20 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const qrWidth = 55,
      qrHeight = 75,
      leftWidth = 130;
    const ROWS_PER_PAGE = 9,
      COLS = 5;
    const pageWidth = doc.page.width - 40,
      pageHeight = doc.page.height - 40;
    const colSpacing = pageWidth / COLS,
      rowSpacing = pageHeight / ROWS_PER_PAGE;
    const logoPath = path.join(
      __dirname,
      "../../../images/trubsond-logo-png.png"
    );

    const dbBatchSize = 1000;
    const dbBatches = Math.ceil(totalCouponsForDB / dbBatchSize);
    const dbCoupons = [];

    for (let dbBatchNum = 0; dbBatchNum < dbBatches; dbBatchNum++) {
      const currentBatchSize = Math.min(
        dbBatchSize,
        totalCouponsForDB - dbBatchNum * dbBatchSize
      );
      const dbBatchCoupons = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const CouponCode = crypto.randomBytes(10).toString("hex").toUpperCase();
        const qrCodeData = await QRCode.toDataURL(CouponCode);

        const couponData = {
          ProductId,
          ExpiryDateTime,
          Amount,
          CouponCode,
          CouponMasterId: couponMasterId,
          CreatedBy: userId,
          ModifiedBy: userId,
          isDynamic: true,
          qrCodeData,
        };

        dbBatchCoupons.push(couponData);
        dbCoupons.push(couponData);
      }

      await Coupon.bulkCreate(dbBatchCoupons);
      if (global.gc) global.gc();
    }

    let pdfCouponIndex = 0;
    let dynamicCouponIndex = 0;

    while (pdfCouponIndex < totalCouponsForPDF) {
      if (pdfCouponIndex > 0 && pdfCouponIndex % (ROWS_PER_PAGE * COLS) === 0) {
        doc.addPage();
      }

      const rowIndex = Math.floor(
        (pdfCouponIndex % (ROWS_PER_PAGE * COLS)) / COLS
      );
      const colIndex = pdfCouponIndex % COLS;
      const x = colIndex * colSpacing + 20;
      const y = rowIndex * rowSpacing + 20;
      const isDynamic = pdfCouponIndex % 2 === 0;

      if (isDynamic) {
        const coupon = dbCoupons[dynamicCouponIndex++];

        doc
          .save()
          .rect(x, y + 22, colSpacing - 10, rowSpacing - 25)
          .fill("#215064")
          .restore();
        doc.image(logoPath, x + 5, y + 5, { width: 45, height: 13 });

        if (coupon.qrCodeData) {
          doc.image(coupon.qrCodeData, x + colSpacing - qrWidth - 15, y + 30, {
            width: qrWidth,
            height: qrHeight,
          });
        }

        const textStartX = x + 5,
          textStartY = y + 30;
        doc
          .fillColor("white")
          .fontSize(7)
          .text("Procedure:", textStartX, textStartY);
        doc
          .fontSize(5)
          .text(
            "To redeem your coupon, contact your",
            textStartX,
            textStartY + 10,
            { width: leftWidth }
          )
          .text("nearest Truebond retailer.", textStartX, textStartY + 16, {
            width: leftWidth,
          })
          .fontSize(7)
          .text("Terms and Conditions:", textStartX, textStartY + 25);

        const terms = [
          "Valid for selected products.",
          "Redeem at authorized stores.",
          "Cannot be exchanged for cash.",
          "Valid until expiry date.",
          "Damaged coupons not accepted.",
        ];
        terms.forEach((term, i) =>
          doc
            .fontSize(5)
            .text(`${i + 1}. ${term}`, textStartX, textStartY + 34 + i * 5)
        );

        doc
          .fontSize(5)
          .text(
            `Code: ${coupon.CouponCode}`,
            x + colSpacing - qrWidth - 15,
            y + 110,
            {
              width: qrWidth,
              align: "center",
            }
          );
      } else {
        const text = "COUPON";
        const fontSize = 10;
        doc.fontSize(fontSize);

        const textWidth = doc.widthOfString(text) + 20;
        const textHeight = doc.currentLineHeight() + 5;
        const textX = x + (colSpacing - textWidth) / 2;
        const textY = y + 100;

        doc
          .save()
          .rect(x, y + 22, colSpacing - 10, rowSpacing - 25)
          .fill("white")
          .restore();
        doc
          .rect(x, y + 7.3, colSpacing - 10, rowSpacing - 10.3)
          .lineWidth(1)
          .stroke("#215064");
        doc
          .roundedRect(textX - 5, textY, textWidth, textHeight, textHeight / 2)
          .fill("#215064")
          .restore();
        doc.image(logoPath, x + colSpacing - qrWidth - 90, y + 30, {
          width: 130,
          height: 50,
        });
        doc.fillColor("white").text(text, textX - 5, textY + 3, {
          width: textWidth,
          align: "center",
        });
      }

      pdfCouponIndex++;

      if (pdfCouponIndex % 1000 === 0) {
        if (global.gc) global.gc();
      }
    }

    doc.end();

    stream.on("finish", () => {
      res.status(201).json({
        success: true,
        message: "Coupons and QR Codes generated successfully.",
        pdfPath: pdfPath,
      });
    });
  } catch (error) {
    console.error("Coupon generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Coupon generation failed",
    });
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
      fromRedeemDate = "",
      toRedeemDate = "",
      // masonsCoupon = [],
      retailersCoupon = [],
      flag = false,
      couponMasterId,
    } = req.body;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const startDate = moment().startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();

    const whereCondition = {
      ...(search && {
        CouponCode: {
          [Op.like]: `%${search}%`,
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
      ...(couponMasterId && {
        CouponMasterId: couponMasterId,
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
      ...(reedemed == true &&
        flag == true && {
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
            [Op.between]: [
              new Date(fromDate),
              new Date(new Date(toDate).setHours(29, 29, 59, 999)),
            ],
          },
        }),
      ...(fromExpiryDate &&
        toExpiryDate && {
          ExpiryDateTime: {
            [Op.between]: [
              new Date(fromExpiryDate),
              new Date(new Date(toExpiryDate).setHours(29, 29, 59, 999)),
            ],
          },
        }),
      ...(fromRedeemDate &&
        toRedeemDate && {
          RedeemDateTime: {
            [Op.between]: [
              new Date(fromRedeemDate),
              new Date(new Date(toRedeemDate).setHours(29, 29, 59, 999)),
            ],
          },
        }),
      // ...(masonsCoupon.length > 0 && {
      //   RedeemTo: {
      //     [Op.in]: masonsCoupon,
      //   },
      // }),
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
      if (req.body.Paid === true || req.body.Paid === false) {
        const [updated] = await Coupon.update(req.body, {
          where: { CouponId: id },
        });
        if (updated) {
          return res.status(200).json({
            success: true,
            message: "Paid status updated successfully!",
          });
        }
      }
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

    if (req.body.RedeemBy) {
      const userCouponsCount = await Coupon.count({
        where: {
          RedeemBy: req.body.RedeemBy,
          ProductId: coupon.ProductId,
        },
      });

      const userLedgerTotalUnits = await LedgerEntry.sum("Unit", {
        where: {
          RetailerUserId: req.body.RedeemBy,
          ProductId: coupon.ProductId,
        },
      });

      const totalPurchasedUnits = userLedgerTotalUnits || 0;

      if (userCouponsCount >= totalPurchasedUnits) {
        const [updated] = await Coupon.update(updateData, {
          where: { CouponId: id },
        });

        return res
          .status(200)
          .json({ success: true, message: "No reward point for this scan..!" });
      }
    }

    const [updated] = await Coupon.update(updateData, {
      where: { CouponId: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    // if (req.body.RedeemTo && req.body.RedeemBy) {
    //   const [mason] = await Promise.all([
    //     User.findByPk(req.body.RedeemTo),
    //     // User.findByPk(req.body.RedeemBy),
    //   ]);

    //   const toMason = `+91${mason.Phone}`;
    //   // const toRetailer = `+91${retailer.Phone}`;

    //   const totalRedeemedAmount = await Coupon.sum("Amount", {
    //     where: { RedeemTo: req.body.RedeemTo },
    //   });

    //   // const redeemedAmount = coupon.Amount;
    //   // const product = await Product.findByPk(coupon.ProductId);

    //   // await RewardPoints.create({
    //   //   RetailerId: req.body.RedeemBy,
    //   //   ProductId: product.ProductId,
    //   //   CouponId: id,
    //   //   RewardPointValue: product.RewardPointValue,
    //   //   CreatedBy: req.user.id,
    //   //   ModifiedBy: req.user.id,
    //   // });

    //   // const totalRewardPoints = await RewardPoints.sum('RewardPointValue', {
    //   //   where: { RetailerId: req.body.RedeemBy },
    //   // });

    //   const messageMason = redeemAmountTemplate(
    //     mason.FirstName,
    //     totalRedeemedAmount
    //   );
    //   await Promise.all([
    //     sendSms(toMason, messageMason),
    //     // sendSms(toRetailer, messageRetailer),
    //   ]);
    // }

    return res
      .status(200)
      .json({ success: true, message: "Coupon updated successfully!" });
  } catch (error) {
    //console.log(error);
    return res
      .status(500)
      .json({ success: false, message: error.message, error: error });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
      // masonid,
      amount,
      sortBy = "RedeemDateTime",
      sortOrder = "DESC",
      page = 1,
      pageSize = 10,
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

    // if (masonid) {
    //   whereCondition.RedeemTo = masonid;
    // }

    const includeCondition = [
      // {
      //   model: User,
      //   as: "RedeemToUser",
      //   attributes: ["FirstName", "LastName", "Phone"],
      //   where: {},
      // },
      {
        model: Product,
        attributes: ["Name", "Price", "WeightOrLitre"],
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
      attributes: [
        "Amount",
        "RedeemDateTime",
        // "RedeemTo",
        "CouponCode",
        "CouponId",
      ],
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
      // Mason_Name: {
      //   name: coupon.RedeemToUser.FirstName,
      //   lastname: coupon.RedeemToUser.LastName,
      //   phone: coupon.RedeemToUser.Phone,
      // },
      Product_Name: {
        name: coupon.Product.Name,
        price: coupon.Product.Price,
        weight: coupon.Product.WeightOrLitre,
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCouponPaidStatus = async (req, res) => {
  try {
    const { couponIds, Paid } = req.body;
    const ModifiedBy = req.user.id;

    const coupons = await Coupon.findAll({
      where: {
        CouponId: couponIds,
      },
    });

    const nonRedeemedCoupons = coupons.filter(
      (coupon) => coupon.RedeemBy === null
    );

    if (nonRedeemedCoupons.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some coupons have not been redeemed.",
        nonRedeemedCoupons: nonRedeemedCoupons.map((c) => c.CouponId),
      });
    }

    const [updated] = await Coupon.update(
      { Paid, ModifiedBy },
      {
        where: {
          CouponId: couponIds,
        },
      }
    );

    if (updated) {
      return res.status(200).json({
        success: true,
        message: "Paid status updated successfully!",
        updatedCount: updated,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to update paid status.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the paid status.",
      error: error.message,
    });
  }
};
