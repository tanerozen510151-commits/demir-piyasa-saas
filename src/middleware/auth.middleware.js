function authenticate(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      message: "Giriş yapmanız gerekiyor"
    });
  }

  next();
}

module.exports = {
  authenticate
};
