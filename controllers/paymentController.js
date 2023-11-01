const Order = require("../models/orderSchema");
const Product = require("../models/productSchema")
const Cart = require("../models/cartSchema");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

module.exports = {
  verifyPayment: async (req, res) => {
    try {
      let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(
        req.body.payment.razorpay_order_id +
          "|" +
          req.body.payment.razorpay_payment_id
      );
  
      hmac = hmac.digest("hex");
      if (hmac === req.body.payment.razorpay_signature) {
        const orderId = new mongoose.Types.ObjectId(
          req.body.order.orderDocument._id
        );
        const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
          PaymentStatus: "Paid",
          Status: "Placed",
          PaymentMethod: "Online",
        });
        // hmac success
        const userId = req.session.user.user;
        const deleteCart = await Cart.findOneAndDelete({ UserId: userId });
        for (let product of deleteCart.Products) {
          const quantityToDecrease = product.Quantity;
          const decreaseQuantity = await Product.findOneAndUpdate(
            {
              _id: product.ProductId,
              "Sizes.Size": product.Size,
            },
            {
              $inc: {
                "Sizes.$.Quantity": -quantityToDecrease,
              },
            }
          );
        }
        res.json({ success: true });
      } else {
        res.json({ failure: true });
      }      
    } catch (error) {
      console.log(error,'error happened');
    }
  },
};
