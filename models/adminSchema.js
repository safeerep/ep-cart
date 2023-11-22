const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const AdminSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
  },
  AccessLevel: {
    type: String,
    default: 'Sub-admin',
    required: true,
  },
  Phone: {
    type: Number,
    unique: true
  },
  Status: {
    type: Boolean,
    default: true
  },
  Createdon: {
    type: String,
  }
});

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = Admin;
