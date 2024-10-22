module.exports = (sequelize, Sequelize) => {
    const MasonSoDetail = sequelize.define(
      "MasonSoDetail",
      {
        MasonSoDetailId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },        
        MasonSoId: {
            type: Sequelize.INTEGER,
        },
        ProductId: {
          type: Sequelize.INTEGER,
        },  
        Quantity: {
          type: Sequelize.INTEGER,
        }, 
        RewardPoints: {
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
    
    MasonSoDetail.associate = function (models) {
      MasonSoDetail.belongsTo(models.Product, {
          foreignKey: "ProductId",
          targetKey: "ProductId",
          constraints: true,
        });
        MasonSoDetail.belongsTo(models.MasonSo, {
          foreignKey: "MasonSoId",
          targetKey: "MasonSoId",
          constraints: true,
        });
        MasonSoDetail.belongsTo(models.Users, {
          foreignKey: "CreatedBy",
          targetKey: "UserId",
          constraints: true,
        });
        MasonSoDetail.belongsTo(models.Users, {
          foreignKey: "ModifiedBy",
          targetKey: "UserId",
          constraints: true,
        });
      };
    return MasonSoDetail;
  };
  