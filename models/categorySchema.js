const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  CategoryName: {
    type: String,
    required: true,
    unique: true,
  },
  Image: {
    type: String,
    required: true,
    unique: true,
  }
});

const Category = mongoose.model("Categories", CategorySchema);

module.exports = Category;
