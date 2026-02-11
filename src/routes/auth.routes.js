///routes/auth routes.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { User } = require("../models");
const { authRequired } = require("../middleware/auth"); // ✅ para /me

function signAppToken(user) {
  return jwt.sign(
    { id: String(user.id), email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// =====================
// Auth0 verifier (RS256)
// =====================
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyAuth0Token(idToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: process.env.AUTH0_CLIENT_ID,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

// =====================
// GET /auth/me ✅ (mejora PRO)
// =====================
router.get("/me", authRequired, async (req, res) => {
  try {
    // authRequired ya pone req.user
    const meId = Number(req.user.id);

    const user = await User.findByPk(meId, {
      attributes: ["id", "full_name", "email", "role", "auth_provider"],
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// =====================
// POST /auth/register
// =====================
router.post("/register", async (req, res) => {
  try {
    const first_name = (req.body.first_name || "").trim();
    const last_name = (req.body.last_name || "").trim();

    const birth_day = Number(req.body.birth_day);
    const birth_month = Number(req.body.birth_month);
    const birth_year = Number(req.body.birth_year);

    const sex = String(req.body.sex || "").trim(); // female | male | na

    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    // ✅ validaciones base
    if (!first_name) return res.status(400).json({ message: "first_name es requerido" });
    if (!last_name) return res.status(400).json({ message: "last_name es requerido" });

    if (!Number.isInteger(birth_day) || birth_day < 1 || birth_day > 31) {
      return res.status(400).json({ message: "birth_day inválido (1-31)" });
    }
    if (!Number.isInteger(birth_month) || birth_month < 1 || birth_month > 12) {
      return res.status(400).json({ message: "birth_month inválido (1-12)" });
    }

    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(birth_year) || birth_year < 1900 || birth_year > currentYear) {
      return res.status(400).json({ message: `birth_year inválido (1900-${currentYear})` });
    }

    const allowedSex = new Set(["female", "male", "na"]);
    if (!allowedSex.has(sex)) {
      return res.status(400).json({ message: "sex inválido (female|male|na)" });
    }

    // email simple (suficiente para app)
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "email inválido" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "password debe tener al menos 6 caracteres" });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: "Correo ya existe" });

    const password_hash = await bcrypt.hash(password, 10);

    const full_name = `${first_name} ${last_name}`.trim();

    const user = await User.create({
      first_name,
      last_name,
      birth_day,
      birth_month,
      birth_year,
      sex,
      full_name,
      email,
      password_hash,
      role: "user",
      auth_provider: "local",
    });

    const token = signAppToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});


// =====================
// POST /auth/login (local)
// =====================
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "email y password son requeridos" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    // ✅ usuarios Auth0 no tienen password_hash
    if (!user.password_hash) {
      return res.status(401).json({ message: "Este usuario inicia sesión con Google (Auth0)" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signAppToken(user);

    // ✅ devuelves token + user (muy útil RN)
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    });
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// =====================
// POST /auth/auth0 { id_token }
// =====================
// =====================
// POST /auth/auth0 { id_token }
// =====================
router.post("/auth0", async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: "id_token es requerido" });

    const decoded = await verifyAuth0Token(id_token);

    const email = (decoded.email || "").toLowerCase();
    const auth0Sub = decoded.sub;

    // ✅ datos típicos de Google/Auth0
    const picture = decoded.picture || null;
    const given = decoded.given_name || "";      // nombre
    const family = decoded.family_name || "";    // apellido
    const name = decoded.name || `${given} ${family}`.trim() || "Usuario";

    if (!email) return res.status(400).json({ message: "El token no trae email" });

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        full_name: name,
        first_name: given || null,
        last_name: family || null,
        avatar_url: picture,              // ✅ FOTO DE GOOGLE
        email,
        password_hash: null,              // ✅ Google
        role: "user",
        auth_provider: "auth0",
        auth0_sub: auth0Sub,
      });
    } else {
      // ✅ actualiza sin romper si ya tenía datos
      user.auth_provider = "auth0";
      user.auth0_sub = auth0Sub;

      if (!user.full_name) user.full_name = name;

      // Si vienen nombres/apellido y están vacíos en DB, los llenas
      if (!user.first_name && given) user.first_name = given;
      if (!user.last_name && family) user.last_name = family;

      // ✅ si Google trae picture, guárdalo
      if (picture) user.avatar_url = picture;

      await user.save();
    }

    const token = signAppToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    res.status(401).json({ message: "Token Auth0 inválido", detail: err.message });
  }
});

module.exports = router;
