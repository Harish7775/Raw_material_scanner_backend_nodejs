const validate =
  (schema, type = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[type]);

    if (error) {
      return res.status(400).json({ error: error.message, success: false });
    }
    next();
  };

module.exports = {
  validate,
};
