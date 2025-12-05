// models/purchaseOrder.model.js
module.exports = (sequelize, Sequelize) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      PurchaseOrderId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      OrderNumber: {
        type: Sequelize.STRING,
        // allowNull: false,
      },
      OrderDate: {
        type: Sequelize.DATEONLY,
        // allowNull: false,
      },
      TotalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        // allowNull: false,
      },
      Status: {
        type: Sequelize.ENUM(
          "Pending",
          "Accepted",
          "Cancelled",
          "Rejected",
          // "Dispatched",
          // "Delivered"
        ),
        defaultValue: "Pending",
        // allowNull: false,
      },

      CreatedBy: {
        type: Sequelize.INTEGER,
      },
    },
    { timestamps: true, paranoid: true }
  );

  PurchaseOrder.associate = function (models) {
    PurchaseOrder.hasMany(models.PurchaseOrderItem, {
      foreignKey: "PurchaseOrderId",
      sourceKey: "PurchaseOrderId",
      as: "items",
      constraints: true,
    });

    PurchaseOrder.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });

    PurchaseOrder.hasOne(models.SalesOrder, {
      foreignKey: "PurchaseOrderId",
      sourceKey: "PurchaseOrderId",
      as: "SalesOrder",
      constraints: true,
    });
  };

  return PurchaseOrder;
};
