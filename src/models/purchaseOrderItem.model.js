// models/purchaseItem.model.js
module.exports = (sequelize, Sequelize) => {
  const PurchaseOrderItem = sequelize.define(
    "PurchaseOrderItem",
    {
      PurchaseOrderItemId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ProductId: {
        type: Sequelize.INTEGER,
      },
      Quantity: {
        type: Sequelize.INTEGER,
        //   allowNull: false,
      },
      UnitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        //   allowNull: false,
      },
      PurchaseOrderId: {
        type: Sequelize.INTEGER,
        //   allowNull: false,
      },
    },
    { timestamps: true, paranoid: true }
  );

  PurchaseOrderItem.associate = function (models) {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, {
      foreignKey: "PurchaseOrderId",
      targetKey: "PurchaseOrderId",
      constraints: true,
    });

    PurchaseOrderItem.belongsTo(models.Product, {
      foreignKey: "ProductId",
      targetKey: "ProductId",
      constraints: true,
    });
  };

  return PurchaseOrderItem;
};
