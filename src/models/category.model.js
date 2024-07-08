module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define(
    "Category",
    {
      CategoryId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false,
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

  Category.associate = function (models) {
    Category.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Category.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Category.hasMany(models.Product, {
      foreignKey: "CategoryId",
      sourceKey: "CategoryId",
      constraints: true,
    });
  };

  return Category;
};
