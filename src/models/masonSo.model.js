module.exports = (sequelize, Sequelize) => {
  const MasonSo = sequelize.define(
    "MasonSo",
    {
      MasonSoId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      MasonId: {
        type: Sequelize.INTEGER,
      },
      TotalRewardPoint: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0.0,
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

  MasonSo.associate = function (models) {
    MasonSo.belongsTo(models.Users, {
      foreignKey: "MasonId",
      targetKey: "UserId",
      constraints: true,
    });
    MasonSo.belongsTo(models.Users, {
      foreignKey: "CreatedBy",
      targetKey: "UserId",
      constraints: true,
    });
    MasonSo.belongsTo(models.Users, {
      foreignKey: "ModifiedBy",
      targetKey: "UserId",
      constraints: true,
    });
    MasonSo.hasMany(models.MasonSoDetail, {
      foreignKey: "MasonSoId",
      sourceKey: "MasonSoId",
      constraints: true,
      as: "details",
    });
  };
  return MasonSo;
};
