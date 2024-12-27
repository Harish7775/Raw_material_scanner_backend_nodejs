const { Sequelize } = require('sequelize');
const config = require('../../sequelize.config.json');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  dialectModule: require('pg'),
  logging: config.logging,
  pool: config.pool,
  port: config.port,
  dialectOptions: config.dialectOptions 
});

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
