module.exports = (sequelize, Sequelize) => {
  const CouponMaster = sequelize.define(
    "CouponMaster",
    {
      CouponMasterId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ProductId: {
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
      Quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      FileName: {
        type: Sequelize.STRING(50),
        allowNull: false,
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
    }
  );

  CouponMaster.associate = function (models) {
    CouponMaster.belongsTo(models.Product, {
      foreignKey: "ProductId",
      targetKey: "ProductId",
      constraints: true,
    });
    CouponMaster.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    CouponMaster.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
  };

  return CouponMaster;
};
