const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Comment = sequelize.define("Comment", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  listing_id: { type: DataTypes.BIGINT, allowNull: false },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  text: { type: DataTypes.STRING(800), allowNull: false }
}, {
  tableName: "comments",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["listing_id"] }]
});

module.exports = Comment;
