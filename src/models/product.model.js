module.exports = (sequelize, Sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      ProductId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      ProductCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      CategoryId: {
        type: Sequelize.INTEGER,
      },
      CompanyId: {
        type: Sequelize.INTEGER,
      },
      WeightInGrams: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      HeightInCm: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      WidthInCm: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      VolumeInLiter: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      Price: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      DiscountPercentage: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      SGSTPercentage: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      CGSTPercentage: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      IGSTPercentage: {
        type: Sequelize.DECIMAL,
        allowNull: true,
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
    }
  );

  Product.associate = function (models) {
    Product.belongsTo(models.Category, {
      foreignKey: "CategoryId",
      targetKey: "CategoryId",
      constraints: true,
    });
    Product.belongsTo(models.Company, {
      foreignKey: "CompanyId",
      targetKey: "CompanyId",
      constraints: true,
    });
    Product.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Product.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
  };

  return Product;
};
