//models/Listing.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Listing = sequelize.define("Listing", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

  seller_user_id: { type: DataTypes.BIGINT, allowNull: false },
  category_id: { type: DataTypes.BIGINT, allowNull: true },

  title: { type: DataTypes.STRING(140), allowNull: false },
  description: { type: DataTypes.STRING(1200), allowNull: true },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "active" }, // active, sold, hidden

  city: { type: DataTypes.STRING(80), allowNull: true },
  
  condition: { type: DataTypes.STRING(40), allowNull: true }, // nuevo, usado_como_nuevo, etc.


  // ubicación aproximada (para radio real sin exponer ubicación exacta)
  lat_approx: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  lon_approx: { type: DataTypes.DECIMAL(10, 7), allowNull: true }
}, {
  tableName: "listings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["seller_user_id"] },
    { fields: ["category_id"] },
    { fields: ["status"] },
    { fields: ["city"] }
  ]
});

module.exports = Listing;
