const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Favorite = sequelize.define("Favorite", {
  user_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
  listing_id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true }
}, {
  tableName: "favorites",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["user_id"] }, { fields: ["listing_id"] }]
});

module.exports = Favorite;
