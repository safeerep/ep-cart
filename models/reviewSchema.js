const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const ReviewsSchema = new mongoose.Schema({
  Rating: {
    type: Number,
  },
  Comment: {
    type: String,
  },
  UserId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  ProductId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  Date: {
    type: String,
    required: true,
  },
});

const Reviews = mongoose.model("Reviews", ReviewsSchema);

module.exports = Reviews;
