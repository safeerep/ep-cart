const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const WishlistsSchema = new mongoose.Schema({
  UserId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  ProductsId: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Products'
    },
  ],
});

const Wishlist = mongoose.model("Wishlists", WishlistsSchema);

module.exports = Wishlist;
