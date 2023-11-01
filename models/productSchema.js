const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const ProductsSchema = new mongoose.Schema({
  ProductName: {
    type: String,
    required: true,
  },
  BasePrice: {
    type: Number,
    required: true,
  },
  Description: {
    type: String,
    required: true,
  },
  BrandName: {
    type: String,
    required: true,
  },
  Tags: {
      type: Array,
  },
  images: {
    type: Array,
    required: true,
  },
  Category: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  SellingPrice: {
    type: Number,
  },
  Status: {
    type: String,
    required: true
  },
  Sizes: [{
    Size: {
      type: Number,
      required: true,
    },
    Quantity: {
      type: Number,
      required: true,
    }
  },],
  Colour: {
    type: String,
  },
  UpdatedOn: {
    type: String
  },
  Display: {
    type: String,
    required: true
  },
  Specification1: {
    type: String
  },
  Specification2: {
    type: String
  },
  Specification3: {
    type: String
  },
  Specification4: {
    type: String
  },
});

const Products = mongoose.model("Products", ProductsSchema);

module.exports = Products;
