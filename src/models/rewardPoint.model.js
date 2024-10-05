module.exports = (sequelize, Sequelize) => {
    const RewardPoint = sequelize.define(
      "RewardPoint",
      {
        RewardPointId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },        
        RetailerId: {
            type: Sequelize.INTEGER,
        },
        ProductId: {
          type: Sequelize.INTEGER,
        },
        CouponId: {
            type: Sequelize.INTEGER,
        },
        RewardDate: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        RewardPointValue: {
          type: Sequelize.DECIMAL,
          allowNull: false,
          defaultValue: 0.00,
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
    
    RewardPoint.associate = function (models) {
        RewardPoint.belongsTo(models.Product, {
          foreignKey: "ProductId",
          targetKey: "ProductId",
          constraints: true,
        });
        RewardPoint.belongsTo(models.Users, {
          foreignKey: "RetailerId",
          targetKey: "UserId",
          constraints: true,
        });
        RewardPoint.belongsTo(models.Coupon, {
          foreignKey: "CouponId",
          targetKey: "CouponId",
          constraints: true,
        });
        RewardPoint.belongsTo(models.Users, {
          foreignKey: "CreatedBy",
          targetKey: "UserId",
          constraints: true,
        });
        RewardPoint.belongsTo(models.Users, {
          foreignKey: "ModifiedBy",
          targetKey: "UserId",
          constraints: true,
        });
      };
    return RewardPoint;
  };
  