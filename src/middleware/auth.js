///mideeleware/auth.js
const jwt = require("jsonwebtoken");

const authRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  console.log("AUTH HEADER:", req.headers.authorization);

  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = { authRequired };
