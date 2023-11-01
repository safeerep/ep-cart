const mongoose = require("mongoose");

const BannersSchema = new mongoose.Schema({
  Image: {
    type: String,
    required: true,
  },
  BannerName: {
    type: String,
  },
  Status: {
    type: Boolean,
  }
});

const Banners = mongoose.model("Banners", BannersSchema);

module.exports = Banners;
