const express = require("express");
const app = express();
let cors = require("cors");
require("dotenv").config();
const allRouters = require("./api/routers/routeIndex");

const path = require("path");
const db = require("../src/models");

db.sequelize.sync({ force: false, alter: true }).then(() => {
  let server = app.listen(process.env.PORT, () => {
    console.log(`Listening to port ${process.env.PORT}`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//routes
app.use("/v1", allRouters);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/pdf", express.static(path.join(__dirname, "..", "pdf")));