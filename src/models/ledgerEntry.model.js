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
      Amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      RetailerUserId: {
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
