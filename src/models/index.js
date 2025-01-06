const { Sequelize } = require("sequelize");
const config = require("../../sequelize.config.json");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    port: config.port,
  }
);

// Gracefully handle shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down server...");
  try {
    await sequelize.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error while closing database connection:", error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGHUP", gracefulShutdown);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require("./user.model.js")(sequelize, Sequelize);
db.Roles = require("./role.model.js")(sequelize, Sequelize);
db.Category = require("./category.model.js")(sequelize, Sequelize);
db.Company = require("./company.model.js")(sequelize, Sequelize);
db.Product = require("./product.model.js")(sequelize, Sequelize);
db.LedgerEntry = require("./ledgerEntry.model.js")(sequelize, Sequelize);
db.Coupon = require("./coupon.model.js")(sequelize, Sequelize);
db.Token = require("./token.model.js")(sequelize, Sequelize);
db.MasonSoDetail = require("./masonSoDetail.model.js")(sequelize, Sequelize);
db.MasonSo = require("./masonSo.model.js")(sequelize, Sequelize);
db.CouponMaster = require("./couponMaster.model.js")(sequelize, Sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
