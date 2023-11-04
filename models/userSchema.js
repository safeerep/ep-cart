const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const UsersSchema = new mongoose.Schema({
  Name: {
    type: String,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Phone: {
    type: Number,
  },
  Password: {
    type: String,
    required: true,
    minlength: 4,
  },
  Status: {
    type: String,
    default: 'Active'
  },
  Createdon: {
    type: String
  },
  WalletAmount: {
    type: Number,
  },
  Address: [
    {
      HouseName: {
        type: String,
      },
      District: {
        type: String,
      },
      State: {
        type: String,
      },
      Pincode: {
        type: String,
      },
    },
  ]
});

const Users = mongoose.model("Users", UsersSchema);

module.exports = Users;
