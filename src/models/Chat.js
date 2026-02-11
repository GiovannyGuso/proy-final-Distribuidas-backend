const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Chat = sequelize.define("Chat", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    listing_id: { type: DataTypes.BIGINT, allowNull: false },
    buyer_user_id: { type: DataTypes.BIGINT, allowNull: false },
    seller_user_id: { type: DataTypes.BIGINT, allowNull: false },

    last_message_at: { type: DataTypes.DATE, allowNull: true },
    // ✅ bloqueo
    is_blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    blocked_reason: { type: DataTypes.STRING(80), allowNull: true },
    blocked_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: "chats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
        // 1 chat por comprador por listing
        { unique: true, fields: ["listing_id", "buyer_user_id"] },
        { fields: ["seller_user_id"] },
    ],
});

module.exports = Chat;
