// middleware/authOptional.js
const jwt = require("jsonwebtoken");
const { verifyAuth0Token } = require("./auth0");

// Intenta Auth0 (RS256). Si falla, intenta JWT propio (HS256).
// Si no hay token, deja req.user = null y sigue (ruta pública).
const authOptional = async (req, _res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    // 1) Probar Auth0
    try {
        const decoded = await verifyAuth0Token(token);
        req.user = decoded; // trae sub, email, etc.
        return next();
    } catch (_) { }

    // 2) Probar JWT propio
    if (process.env.JWT_SECREt) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            req.user = payload; // { id, email, role }
            return next();
        } catch (_) { }
    }

    // Token inválido para ambos → no bloquear ruta pública
    req.user = null;
    next();
};

module.exports = { authOptional };
