const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;
const OrdersSchema = new mongoose.Schema({
  UserId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  Products: [{ 
    ProductId: {
      type: Schema.Types.ObjectId,
      required: true, 
      ref: 'Products'
    },
    Quantity: {
      type: Number,
      required: true
    },
    Size: {
      type: Number,
      required: true
    }
  },], 
  ShippingAddress: {
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
  Date: {
    type: String,
    required: true,
  },
  ExpectedDeliveryOn: {
    type: String,
    required: true,
  },
  DeliveredOn: {
    type: String,
  },
  TotalPrice: {
    type: Number,
    required: true,
  },
  PayableAmount: {
    type: Number,
  },
  Discount: {
    type: Number,
    required: true,
  },
  Status: {
    type: String,
    required: true,
  },
  CouponId: {
    type: Schema.Types.ObjectId,
  },
  PaymentMethod: {
    type: String,
  },
  PaymentStatus: {
    type: String,
  },
  CancelReason: {
    type: String,
  }
});

const Orders = mongoose.model("Orders", OrdersSchema);

module.exports = Orders;
