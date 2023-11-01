const mongoose = require("mongoose");

const RefferalOfferSchema = new mongoose.Schema({
  OfferforReferrer: {
    type: Number,
    required: true,
  },
  OfferforReferred: {
    type: Number,
    required: true,
  },
  Active: {
    type: Boolean,
  },
});

const RefferalOffer = mongoose.model("RefferalOffer", RefferalOfferSchema);

module.exports = RefferalOffer;
