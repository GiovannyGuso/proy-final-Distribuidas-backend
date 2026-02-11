// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    // ✅ nuevo (Facebook-style)
    first_name: { type: DataTypes.STRING(60), allowNull: true },
    last_name: { type: DataTypes.STRING(60), allowNull: true },
    birth_day: { type: DataTypes.SMALLINT, allowNull: true },
    birth_month: { type: DataTypes.SMALLINT, allowNull: true },
    birth_year: { type: DataTypes.SMALLINT, allowNull: true },
    sex: { type: DataTypes.STRING(20), allowNull: true }, // female | male | na
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.STRING(280), allowNull: true },

    
    // ✅ compat (para no romper app actual)
    full_name: { type: DataTypes.STRING(120), allowNull: false },

    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },

    // Para login normal (email/password). Para Auth0 puede quedar NULL.
    password_hash: { type: DataTypes.STRING(200), allowNull: true },

    // ✅ recomiendo estandarizar: local | auth0
    auth_provider: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "local",
    },

    // para Auth0 Google (sub). para normal queda NULL.
    auth0_sub: { type: DataTypes.STRING(120), allowNull: true, unique: true },

    role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "user" },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;