//models/index.js
const User = require("./User");
const Category = require("./Category");
const Listing = require("./Listing");
const ListingImage = require("./ListingImage");
const Favorite = require("./Favorite");
const Comment = require("./Comment");
const Rating = require("./Rating");

// ✅ nuevos
const Chat = require("./Chat");
const Message = require("./Message");

// User (vendedor) -> Listings
User.hasMany(Listing, { foreignKey: "seller_user_id", onDelete: "CASCADE" });
Listing.belongsTo(User, { foreignKey: "seller_user_id", as: "Seller" });

// Category -> Listings
Category.hasMany(Listing, { foreignKey: "category_id", as: "listings" });
Listing.belongsTo(Category, { foreignKey: "category_id", as: "category" });



// Listing -> Images (as: images)
Listing.hasMany(ListingImage, { foreignKey: "listing_id", as: "images", onDelete: "CASCADE" });
ListingImage.belongsTo(Listing, { foreignKey: "listing_id", as: "listing" });

// Favorites (many-to-many)
User.belongsToMany(Listing, {
  through: Favorite,
  foreignKey: "user_id",
  otherKey: "listing_id",
  as: "FavoriteListings",
});
Listing.belongsToMany(User, {
  through: Favorite,
  foreignKey: "listing_id",
  otherKey: "user_id",
  as: "FavoritedBy",
});

// Listing -> Comments
Listing.hasMany(Comment, { foreignKey: "listing_id", onDelete: "CASCADE" });
Comment.belongsTo(Listing, { foreignKey: "listing_id", as: "listing" });

User.hasMany(Comment, { foreignKey: "user_id", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Listing -> Ratings
Listing.hasMany(Rating, { foreignKey: "listing_id", onDelete: "CASCADE" });
Rating.belongsTo(Listing, { foreignKey: "listing_id", as: "listing" });

User.hasMany(Rating, { foreignKey: "rater_user_id", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "rater_user_id", as: "Rater" });

/* =======================
   ✅ CHAT 1-1 POR LISTING
   ======================= */

// Listing -> Chats
Listing.hasMany(Chat, { foreignKey: "listing_id", as: "chats", onDelete: "CASCADE" });
Chat.belongsTo(Listing, { foreignKey: "listing_id", as: "listing" });

// User -> Chats (buyer/seller)
User.hasMany(Chat, { foreignKey: "buyer_user_id", as: "buyerChats", onDelete: "CASCADE" });
User.hasMany(Chat, { foreignKey: "seller_user_id", as: "sellerChats", onDelete: "CASCADE" });

Chat.belongsTo(User, { foreignKey: "buyer_user_id", as: "Buyer" });
Chat.belongsTo(User, { foreignKey: "seller_user_id", as: "Seller" });

// Chat -> Messages
Chat.hasMany(Message, { foreignKey: "chat_id", as: "messages", onDelete: "CASCADE" });
Message.belongsTo(Chat, { foreignKey: "chat_id", as: "chat" });

// User -> Messages
User.hasMany(Message, { foreignKey: "sender_user_id", as: "sentMessages", onDelete: "CASCADE" });
Message.belongsTo(User, { foreignKey: "sender_user_id", as: "Sender" });



module.exports = {
  User,
  Category,
  Listing,
  ListingImage,
  Favorite,
  Comment,
  Rating,
  Chat,
  Message,
};
