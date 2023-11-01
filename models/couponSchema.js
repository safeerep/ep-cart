const mongoose = require("mongoose");

const CouponsSchema = new mongoose.Schema({
  CouponName: {
    type: String,
    required: true,
  },
  CouponCode: {
    type: String,
    required: true,
    unique: true,
  },
  CreatedOn: {
    type: String,
    required: true,
  },
  ExpireDate: {
    type: String,
    required: true,
  },
  Discount: {
    type: Number,
    required: true,
  },
  MinOrderAmount: {
    type: Number,
    required: true,
  },
  Active: {
    type: Boolean,
  },
  Limit: {
    type: String,
  },
  UsedBy: [{
    type: mongoose.Types.ObjectId,
  }]
});

const Coupons = mongoose.model("Coupons", CouponsSchema);

module.exports = Coupons;
