// Validates req.body against a Joi schema, replying with a consistent 400 envelope on failure.
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message).join(', ');
      return res.fail(details, 'Validation failed', 400);
    }
    req.body = value;
    next();
  };
}

module.exports = validateRequest;
