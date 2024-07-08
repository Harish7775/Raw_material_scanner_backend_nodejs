module.exports = (sequelize, Sequelize) => {
  const Roles = sequelize.define(
    "Roles",
    {
      RoleId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Name: {
        type: Sequelize.ENUM("Admin", "Retailer", "Mason"),
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

  Roles.associate = function (models) {
    Roles.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Roles.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
    Roles.hasMany(models.Users, {
      foreignKey: "RoleId",
      sourceKey: "RoleId",
      constraints: true,
    });
  };
  return Roles;
};
