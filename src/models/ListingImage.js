const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ListingImage = sequelize.define("ListingImage", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.BIGINT, allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: "listing_images",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["listing_id"] }]
});

module.exports = ListingImage;
