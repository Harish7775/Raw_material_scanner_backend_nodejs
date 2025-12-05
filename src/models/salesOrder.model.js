// models/SalesOrder.js
module.exports = (sequelize, DataTypes) => {
  const SalesOrder = sequelize.define(
    "SalesOrder",
    {
      SalesOrderId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      OrderNumber: {
        type: DataTypes.STRING,
        //   unique: true,
        //   allowNull: false,
      },
      CustomerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      OrderDate: {
        type: DataTypes.DATE,
        //   defaultValue: DataTypes.NOW,
      },
      TotalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        //   defaultValue: 0.0,
      },
      Status: {
        type: DataTypes.ENUM(
          "Accepted",
          "Dispatched",
          "Delivered",
          "Not Accepted"
        ),
        defaultValue: "Accepted",
      },
      CreatedBy: {
        type: DataTypes.INTEGER,
        //   allowNull: false,
      },
      PurchaseOrderId: {
        type: DataTypes.INTEGER,
        //   allowNull: true,
      },
    },
    { timestamps: true, paranoid: true }
  );

  SalesOrder.associate = (models) => {
    SalesOrder.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });

    SalesOrder.belongsTo(models.PurchaseOrder, {
      foreignKey: "PurchaseOrderId",
      targetKey: "PurchaseOrderId",
      constraints: true,
    });

    SalesOrder.belongsTo(models.Users, {
      foreignKey: "CustomerId",
      targetKey: "UserId",
      as: "Customer",
      constraints: true,
    });

    SalesOrder.hasMany(models.SalesOrderItem, {
      foreignKey: "SalesOrderId",
      as: "items",
      foreignKey: "SalesOrderId",
    });
  };

  return SalesOrder;
};
