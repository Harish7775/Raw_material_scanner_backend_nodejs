const express = require("express");

const authRoutes = require("./auth.route");
const categoryRoute = require("./category.route");
const userRoute = require("./user.route");
const companyRoute = require("./company.route");
const productRoute = require("./product.route");
const roleRoute = require("./role.route");
const couponRoute = require("./coupon.route");
const ledgerRoute = require('./ledgerEntry.route');

const allRouters = express.Router();

allRouters.use("/auth", authRoutes);
allRouters.use("/category", categoryRoute);
allRouters.use("/user", userRoute);
allRouters.use("/company", companyRoute);
allRouters.use("/product", productRoute);
allRouters.use("/role", roleRoute);
allRouters.use("/coupon", couponRoute);
allRouters.use("/ledger", ledgerRoute);

module.exports = allRouters;
