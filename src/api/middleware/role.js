const constants = require("../../helper/constants");
const config = require("../../helper/config");
const jwt = require("jsonwebtoken");

const validateRole = (roles) => async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(500)
      .send({ statusCode: 500, message: constants.auth.not_authorize });
  }
};

module.exports = validateRole;
