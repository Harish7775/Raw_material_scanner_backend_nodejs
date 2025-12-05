// models/SalesOrderItem.js
module.exports = (sequelize, DataTypes) => {
  const SalesOrderItem = sequelize.define(
    "SalesOrderItem",
    {
      SalesOrderItemId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      SalesOrderId: {
        type: DataTypes.INTEGER,
        //   allowNull: false,
      },
      ProductId: {
        type: DataTypes.INTEGER,
        //   allowNull: false,
      },
      Quantity: {
        type: DataTypes.INTEGER,
        //   allowNull: false,
      },
      UnitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        //   allowNull: false,
      },
    },
    { timestamps: true, paranoid: true }
  );

  SalesOrderItem.associate = (models) => {
    SalesOrderItem.belongsTo(models.SalesOrder, {
      foreignKey: "SalesOrderId",
      targetKey: "SalesOrderId",
      constraints: true,
    });

    SalesOrderItem.belongsTo(models.Product, {
      foreignKey: "ProductId",
      targetKey: "ProductId",
      constraints: true,
    });
  };

  return SalesOrderItem;
};
