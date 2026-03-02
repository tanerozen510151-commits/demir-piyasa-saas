const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader =
    req.headers.authorization || req.headers.Authorization;

  console.log("HEADERS:", req.headers);
  console.log("AUTH HEADER:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: "Lütfen giriş yapın" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Geçersiz veya süresi dolmuş token",
    });
  }
}

module.exports = {
  authenticate
};
