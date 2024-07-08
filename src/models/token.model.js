module.exports = (sequelize, Sequelize) => {
  const Token = sequelize.define(
    "Token",
    {
      TokenId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      Token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: () => new Date(Date.now() + 3600 * 1000),
      },
    },
    {
      timestamps: true,
      paranoid: true,
    }
  );

  return Token;
};
