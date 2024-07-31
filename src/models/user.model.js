module.exports = (sequelize, Sequelize) => {
  const Users = sequelize.define(
    "Users",
    {
      UserId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      FirstName: {
        type: Sequelize.STRING(100),
      },
      ShopName: {
        type: Sequelize.STRING(100),
      },
      Address: {
        type: Sequelize.STRING(300),
      },
      LastName: {
        type: Sequelize.STRING,
      },
      Email: {
        type: Sequelize.STRING,
      },
      Phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      Password: {
        type: Sequelize.STRING,
      },
      RoleId: {
        type: Sequelize.INTEGER,
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

  Users.associate = function (models) {
    Users.belongsTo(models.Roles, {
      foreignKey: "RoleId",
      targetKey: "RoleId",
      constraints: true,
      as: "Role",
    });
    Users.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Users.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Users.hasMany(models.Coupon, {
      foreignKey: "RedeemTo",
      as: "ScannedCoupons",
      constraints: true,
    });
  };

  return Users;
};
