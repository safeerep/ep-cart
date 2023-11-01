const mongoose = require("mongoose");

const OffersSchema = new mongoose.Schema({
  CategoryName: {
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
  Active: {
    type: Boolean,
  },
});

const Offers = mongoose.model("Offers", OffersSchema);

module.exports = Offers;
