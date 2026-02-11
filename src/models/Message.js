const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define(
  "Message",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    chat_id: { type: DataTypes.BIGINT, allowNull: false },
    sender_user_id: { type: DataTypes.BIGINT, allowNull: false },

    // text | image | mixed
    type: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "text" },

    text: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },

    // ✅ WhatsApp status
    delivered_at: { type: DataTypes.DATE, allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["chat_id"] },
      { fields: ["sender_user_id"] },
      { fields: ["created_at"] },
      { fields: ["delivered_at"] },
      { fields: ["read_at"] },
    ],
  }
);

module.exports = Message;
