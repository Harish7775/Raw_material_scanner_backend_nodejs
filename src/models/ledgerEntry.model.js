module.exports = (sequelize, Sequelize) => {
  const LedgerEntry = sequelize.define(
    "LedgerEntry",
    {
      LedgerId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      EntryType: {
        type: Sequelize.ENUM("Debit", "Credit"),
        allowNull: false,
      },
      Note: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      Amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      TransactionDate: {
        type: Sequelize.DATE,
      },
      Unit: {
        type: Sequelize.INTEGER,
      },
      PersonalNote: {
        type: Sequelize.STRING(100),
      },
      RetailerUserId: {
        type: Sequelize.INTEGER,
      },
      ProductId: {
        type: Sequelize.INTEGER,
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

  LedgerEntry.associate = function (models) {
    LedgerEntry.belongsTo(models.Users, {
      foreignKey: "RetailerUserId",
      targetKey: "UserId",
      constraints: true,
      as: "UserDetail",
    });
    LedgerEntry.belongsTo(models.Product, {
      foreignKey: "ProductId",
      targetKey: "ProductId",
      constraints: true,
      as: "ProductDetail",
    });
    LedgerEntry.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    LedgerEntry.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
  };

  return LedgerEntry;
};
