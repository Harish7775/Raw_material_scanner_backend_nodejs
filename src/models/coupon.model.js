module.exports = (sequelize, Sequelize) => {
  const Coupon = sequelize.define(
    "Coupon",
    {
      CouponId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      CouponCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        // unique: true,
      },
      ProductId: {
        type: Sequelize.INTEGER,
      },
      CouponMasterId: {
        type: Sequelize.INTEGER,
      },
      ExpiryDateTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      // RedeemTo: {
      //   type: Sequelize.INTEGER,
      // },
      RedeemBy: {
        type: Sequelize.INTEGER,
      },
      RedeemDateTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      Paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      IsActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      CreatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ModifiedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["CouponCode"],
        },
      ],
    }
  );

  Coupon.associate = function (models) {
    Coupon.belongsTo(models.Product, {
      foreignKey: "ProductId",
      targetKey: "ProductId",
      constraints: true,
    });
    Coupon.belongsTo(models.CouponMaster, {
      foreignKey: "CouponMasterId",
      targetKey: "CouponMasterId",
      constraints: true,
    });
    Coupon.belongsTo(models.Users, {
      as: "RedeemToUser",
      foreignKey: "RedeemTo",
      targetKey: "UserId",
      constraints: true,
    });
    Coupon.belongsTo(models.Users, {
      as: "RedeemByUser",
      foreignKey: "RedeemBy",
      targetKey: "UserId",
      constraints: true,
    });
    Coupon.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Coupon.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
  };

  return Coupon;
};
