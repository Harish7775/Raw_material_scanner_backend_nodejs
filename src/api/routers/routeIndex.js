const express = require("express");

const categoryRoute = require("./category.route");
const userRoute = require("./user.route");
const companyRoute = require("./company.route");
const productRoute = require("./product.route");
const roleRoute = require("./role.route");
const couponRoute = require("./coupon.route");
const ledgerRoute = require('./ledgerEntry.route');
const masonSoRoute = require('./masonSo.route');
const couponMasterRoute = require('./couponMaster.route');

const allRouters = express.Router();

allRouters.use("/category", categoryRoute);
allRouters.use("/user", userRoute);
allRouters.use("/company", companyRoute);
allRouters.use("/product", productRoute);
allRouters.use("/role", roleRoute);
allRouters.use("/coupon", couponRoute);
allRouters.use("/ledger", ledgerRoute);
allRouters.use("/masonso", masonSoRoute);
allRouters.use("/couponMaster", couponMasterRoute);

module.exports = allRouters;
