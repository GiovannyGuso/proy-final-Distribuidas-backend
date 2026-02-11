const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Rating = sequelize.define("Rating", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.BIGINT, allowNull: false },
  rater_user_id: { type: DataTypes.BIGINT, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "ratings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [
    { unique: true, fields: ["listing_id", "rater_user_id"] },
    { fields: ["listing_id"] }
  ]
});

module.exports = Rating;
