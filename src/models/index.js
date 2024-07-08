const dbConfig = require("../../sequelize.config.json");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
    logging: dbConfig.logging,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require("./user.model.js")(sequelize, Sequelize);
db.Roles = require("./role.model.js")(sequelize, Sequelize);
db.Category = require("./category.model.js")(sequelize, Sequelize);
db.Company = require("./company.model.js")(sequelize, Sequelize);
db.Product = require("./product.model.js")(sequelize, Sequelize);
db.Ledger = require("./ledgerEntry.model.js")(sequelize, Sequelize);
db.Coupon = require("./coupon.model.js")(sequelize, Sequelize);
db.Token = require("./token.model.js")(sequelize, Sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
