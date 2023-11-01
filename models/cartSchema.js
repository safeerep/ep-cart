const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const CartsSchema = new mongoose.Schema({
  UserId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  Products: [
    {
      ProductId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Products'
      },
      Quantity: {
        type: Number,
        required: true,
      },
      Size: {
        type: Number,
      }
    },
  ],
  Discount: {
    type: Number,
  },
  CouponId: {
    type: Schema.Types.ObjectId,
  }
});

const Carts = mongoose.model("Carts", CartsSchema);

module.exports = Carts;
