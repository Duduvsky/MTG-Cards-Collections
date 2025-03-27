const formDataParser = (req, res, next) => {
  if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
    // Converte os campos do form-data em um objeto JSON
    req.body = { ...req.body };
  }
  next();
};

module.exports = formDataParser;
