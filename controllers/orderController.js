const Order = require("../models/orderSchema");
const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const helper = require("../helpers/userHelper");
const razorpayHelper = require("../services/razorPay");
const path = require("path");
const mongoose = require("mongoose");
const moment = require("moment");

module.exports = {
  checkOutPage: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const userCart = await Cart.findOne({ UserId: userId });
      if (!userCart) {
        res.redirect("/cart");
      } else {
        const userData = await User.findById(userId).lean();
        const payable = await helper.getPrice(userId);
        let hasWallet = false;
        if (userData.WalletAmount > 0) {
          hasWallet = true;
        }
        res.render("user/checkout", {
          user: true,
          userData,
          payable,
          hasWallet,
          message: req.flash(),
        });
      }
      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  // place order
  placeOrder: async (req, res) => {
    try {
      
      const address = req.body.deliveryAddress;
      const paymentMethod = req.body.paymentMethod;
      const userId = req.session.user.user;
      if (address !== undefined) {
        const userData = await User.findById(userId);
        const shippingAddress = userData.Address.find((item) =>
          item._id.equals(address)
        );
        const cartDetails = await Cart.findOne({ UserId: userId });
        if (cartDetails) {
          const total = await helper.getTotal(userId);
          const payable = await helper.getPrice(userId);
          const discount = total - payable;
  
          const products = [];
          for (let product of cartDetails.Products) {
            const item = {
              ProductId: new mongoose.Types.ObjectId(product.ProductId),
              Quantity: product.Quantity,
              Size: product.Size,
            };
            products.push(item);
          }
  
          // placing order
          const today = new Date();
          const deliveryDate = new Date(today);
          deliveryDate.setDate(today.getDate() + 7);
  
          const orderDocument = new Order({
            UserId: new mongoose.Types.ObjectId(userId),
            Products: products,
            ShippingAddress: shippingAddress,
            Date: moment(today).format("lll"),
            ExpectedDeliveryOn: moment(deliveryDate).format("ll"),
            TotalPrice: total,
            PayableAmount: payable,
            Discount: discount,
            Status: "Placed",
          });
          await orderDocument.save();
  
          const orderId = orderDocument._id;
  
          // checking payment methods starting
          // cash on delivery
          if (paymentMethod === "COD") {
            const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
              PaymentStatus: "Pending",
              PaymentMethod: "COD",
            });
  
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
            res.json({ codSuccess: true });
          }
          // online payment
          else if (paymentMethod === "Online") {
            razorpayHelper
              .createRazorpayOrder(orderDocument)
              .then(async (paymentResponse) => {
                const response = {
                  paymentResponse,
                  orderDocument,
                  onlinePayment: true,
                };
                const updateOrderDocument = await Order.findByIdAndUpdate(
                  orderId,
                  {
                    PaymentStatus: "Pending",
                    PaymentMethod: "Online",
                    Status: "Attempted",
                  }
                );
                res.json(response);
              })
              .catch(async (err) => {
                const updateOrderDocument = await Order.findByIdAndUpdate(
                  orderId,
                  {
                    PaymentStatus: "Declined",
                    PaymentMethod: "Online",
                    Status: "Attempted",
                  }
                );
                const response = {
                  onlinePaymentFailed: true,
                };
                console.log(`an error occured ${err}`);
                res.json(response);
              });
          }
          // the remaining one option is wallet
          // wallet payment
          else {
            if (userData.WalletAmount < payable) {
              const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
                PaymentStatus: "Declined",
                PaymentMethod: "Wallet",
                Status: "Attempted",
              });
              res.json({ walletPaymentFailed: true });
            } else {
              const updateUserWallet = await User.findByIdAndUpdate(userId, {
                $inc: { WalletAmount: -payable },
              });
              const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
                PaymentStatus: "Paid",
                PaymentMethod: "Wallet",
                Status: "Placed",
              });
  
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
              res.json({ walletPaymentSuccess: true });
            }
          }
        } else {
          // nocart
          res.json({ noCart: true });
        }
      }
      // don't have an address;
      else {
        res.json({ noAddressAdded: true });
      }
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  orderSuccessful: async (req, res) => {
    try {
      const order = await Order.findOne({ UserId: req.session.user.user }).sort({
        _id: -1,
      });
      if (!order) {
        res.redirect("/cart");
      } else {
        const orderId = order._id;
        res.render("user/order-successful", { user: true, orderId });
      }     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  orders: async (req, res) => {
    try {
      
      const userId = req.session.user.user;
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 5;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await Order.countDocuments({
        UserId: userId,
        Status: { $ne: "Attempted" },
      }).lean();
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
      const orders = await Order.find({
        UserId: userId,
        Status: { $ne: "Attempted" },
      })
        .populate("Products.ProductId")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      if (!orders.length) {
        res.render("user/orders", { user: true, noOrder: true });
      } else {
        res.render("user/orders", {
          user: true,
          orders,
          currentPage,
          totalCount,
          startIndex,
          endIndex,
          hasPreviousPage,
          previousPage,
          hasNextPage,
          nextPage,
        });
      }
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  trackOrder: async (req, res) => {
    try {
      
      const userId = req.session.user.user;
      const orderId = req.params.id;
      const userDetails = await User.findById(userId).lean();
      const orderDetails = await Order.findById(orderId).lean();
      const productDetails = await Order.findById({ _id: orderId })
        .populate("Products.ProductId")
        .lean();
  
      if (productDetails === null || orderDetails === null) {
        res.redirect("/cart");
      } else {
        let cancelOption;
        let returnOption;
        let cancelled;
        let reviewOption;
        let stage1 = false,
          stage2 = false,
          stage3 = false,
          stage4 = false;
  
        if (
          orderDetails.Status === "Placed" ||
          orderDetails.Status === "Confirmed" ||
          orderDetails.Status === "Shipped"
        ) {
          if (orderDetails.Status === "Placed") {
            stage1 = true;
          } else if (orderDetails.Status === "Confirmed") {
            stage2 = true;
          } else {
            stage3 = true;
          }
          cancelOption = true;
          returnOption = false;
          cancelled = false;
          reviewOption = false;
        } else if (orderDetails.Status === "Delivered") {
          stage4 = true;
          const deliveredOn = moment(
            orderDetails.DeliveredOn,
            "MMM D, YYYY h:mm A"
          ).toDate();
          const sevenDaysLater = moment(deliveredOn).add(7, "days").toDate();
          const currentDate = new Date();
          if (currentDate < sevenDaysLater) {
            returnOption = true;
          }
          cancelOption = false;
          cancelled = false;
          reviewOption = true;
        } else if (
          orderDetails.Status === "Cancelled" ||
          orderDetails.Status === "Rejected"
        ) {
          cancelled = true;
          reviewOption = false;
          cancelOption = false;
          returnOption = false;
        } else if (orderDetails.Status === "Returned") {
          reviewOption = true;
          cancelled = true;
          cancelOption = false;
          returnOption = false;
        } else {
          reviewOption = true;
        }
        const products = productDetails.Products;
        res.render("user/track-order", {
          user: true,
          orderDetails,
          userDetails,
          products,
          cancelOption,
          returnOption,
          reviewOption,
          cancelled,
          stage1,
          stage2,
          stage3,
          stage4,
        });
      }
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  cancelOrder: async (req, res) => {
    try {
      
      const orderId = req.params.id;
      const updateOrder = await Order.findByIdAndUpdate(orderId, {
        $set: {
          Status: "Cancelled",
          PaymentStatus: "Returned",
          CancelReason: req.body.Reason,
        },
      });
      if (
        updateOrder.PaymentMethod === "Online" ||
        updateOrder.PaymentMethod === "Wallet"
      ) {
        const amount = updateOrder.PayableAmount;
        if (updateOrder.PaymentStatus === "Paid") {
          const userId = req.session.user.user;
          const userDataUpdate = await User.findByIdAndUpdate(userId, {
            $inc: {
              WalletAmount: amount,
            },
          });
        } else {
          console.log("in else");
        }
      }
  
      if (updateOrder.Products) {
        for (let product of updateOrder.Products) {
          const quantityToIncrease = product.Quantity;
          const IncreaseQuantity = await Product.findOneAndUpdate(
            {
              _id: product.ProductId,
              "Sizes.Size": product.Size,
            },
            {
              $inc: {
                "Sizes.$.Quantity": quantityToIncrease,
              },
            }
          );
        }
      }
      res.redirect("/orders");
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  returnOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
        CancelReason: req.body.Reason,
        Status: "Requested for Return",
      });
  
      res.redirect("/orders");
      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  createInvoice: async (req, res) => {
    try {
      const orderId = req.body.orderId;
      const orderDetails = await Order.findById({ _id: orderId })
        .populate("Products.ProductId")
        .lean();

      const filepath = await helper.createPdf(orderDetails);

      res.json({ response: true, filepath });
    } catch (error) {
      console.log("an error happened", error);
    }
  },

  downloadInvoice: (req, res) => {
    try {
      const orderId = req.params.orderId;
      const filepath = path.join(__dirname, `../public/pdf/${orderId}.pdf`);
      res.download(filepath, "invoice.pdf");     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  // admin
  // orders controll
  ordersList: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
  
      const totalCount = await Order.countDocuments().lean();
      const returnRequests = await Order.countDocuments({
        Status: "Requested for Return",
      }).lean();
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
  
      const orders = await Order.find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/orders", {
        verifiedAdmin: true,
        allOrders: true,
        orders,
        returnRequests,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  pendingOrdersList: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
  
      const returnRequests = await Order.countDocuments({
        Status: "Requested for Return",
      }).lean();
      const totalCount = await Order.countDocuments({
        Status: {
          $nin: [
            "Cancelled",
            "Delivered",
            "Requested for Return",
            "Return request rejected",
            "Return request accepted",
            "Rejected",
            "Attempted",
            "Returned",
          ],
        },
      }).lean();
  
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
      const orders = await Order.find({
        Status: {
          $nin: [
            "Cancelled",
            "Delivered",
            "Requested for Return",
            "Return request rejected",
            "Return request accepted",
            "Rejected",
            "Attempted",
            "Returned",
          ],
        },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/orders", {
        verifiedAdmin: true,
        pendingOrders: true,
        orders,
        returnRequests,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
      });     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  cancelledOrdersList: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
      const returnRequests = await Order.countDocuments({
        Status: "Requested for Return",
      }).lean();
      const totalCount = await Order.countDocuments({
        Status: {
          $eq: "Cancelled",
        },
      }).lean();
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
      const orders = await Order.find({
        Status: {
          $eq: "Cancelled",
        },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/orders", {
        verifiedAdmin: true,
        orders,
        returnRequests,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
        cancelled: true,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  returnRelated: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
      const returnRequests = await Order.countDocuments({
        Status: "Requested for Return",
      }).lean();
      const totalCount = await Order.countDocuments({
        Status: {
          $in: [
            "Returned",
            "Requested for Return",
            "Return request accepted",
            "Return request rejected",
          ],
        },
      }).lean();
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
      const orders = await Order.find({
        Status: {
          $in: [
            "Returned",
            "Requested for Return",
            "Return request accepted",
            "Return request rejected",
          ],
        },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/orders", {
        verifiedAdmin: true,
        orders,
        returnRequests,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
        returnRequest: true,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  returnRequests: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
      const returnRequests = await Order.countDocuments({
        Status: "Requested for Return",
      }).lean();
      const totalCount = await Order.countDocuments({
        Status: {
          $in: ["Requested for Return"],
        },
      }).lean();
      const startIndex = (currentPage - 1) * perPage + 1;
      const endIndex = Math.min(currentPage * perPage, totalCount);
      const totalPages = Math.ceil(totalCount / perPage);
      let hasNextPage = false;
      let hasPreviousPage = false;
      if (totalPages > currentPage) {
        hasNextPage = true;
      }
      if (currentPage > 1) {
        hasPreviousPage = true;
      }
      const orders = await Order.find({
        Status: {
          $in: ["Requested for Return"],
        },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/orders", {
        verifiedAdmin: true,
        orders,
        returnRequests,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
        returnRequest: true,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  updateOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const status = req.query.status;
      if (status === "Rejected") {
        const orderDetails = await Order.findById(orderId);
        if (orderDetails?.Products) {
          for (let product of orderDetails.Products) {
            const quantityToIncrease = product.Quantity;
            const IncreaseQuantity = await Product.findOneAndUpdate(
              {
                _id: product.ProductId,
                "Sizes.Size": product.Size,
              },
              {
                $inc: {
                  "Sizes.$.Quantity": quantityToIncrease,
                },
              }
            );
          }
        }
        const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
          Status: "Rejected",
          PaymentStatus: "Returned",
        });
        if (orderDetails.PaymentStatus === "Paid") {
          const userId = updateOrderDocument.UserId;
          const amount = updateOrderDocument.PayableAmount;
          const userDataUpdate = await User.findByIdAndUpdate(userId, {
            $inc: {
              WalletAmount: amount,
            },
          });
        }
      }
      if (status === "Delivered") {
        const orderData = await Order.findByIdAndUpdate(orderId, {
          Status: status,
          DeliveredOn: moment(new Date()).format("lll"),
          PaymentStatus: "Paid",
        });
      } else if (status === "Returned") {
        const updateOrderDocument = await Order.findByIdAndUpdate(orderId, {
          Status: "Returned",
          PaymentStatus: "Returned",
        });
  
        const userId = updateOrderDocument.UserId;
        const amount = updateOrderDocument.PayableAmount;
        const userDataUpdate = await User.findByIdAndUpdate(userId, {
          $inc: {
            WalletAmount: amount,
          },
        });
  
        if (updateOrderDocument?.Products) {
          for (let product of updateOrderDocument.Products) {
            const quantityToIncrease = product.Quantity;
            const IncreaseQuantity = await Product.findOneAndUpdate(
              {
                _id: product.ProductId,
                "Sizes.Size": product.Size,
              },
              {
                $inc: {
                  "Sizes.$.Quantity": quantityToIncrease,
                },
              }
            );
          }
        }
      } else {
        const orderData = await Order.findByIdAndUpdate(orderId, {
          Status: status,
        });
      }
      res.redirect("/admin/orders");      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  rejectOrderByAdmin: async (req, res) => {
    try {
      const id = req.params.id;
      const particularOrder = await Order.findByIdAndUpdate(id, {
        Status: "Rejected",
      });

      for (let product of particularOrder.Products) {
        const quantityToIncrease = product.Quantity;
        const IncreaseQuantity = await Product.findOneAndUpdate(
          {
            _id: product.ProductId,
            "Sizes.Size": product.Size,
          },
          {
            $inc: {
              "Sizes.$.Quantity": quantityToIncrease,
            },
          }
        );
      }
      res.redirect("/admin/orders");
    } catch (error) {
      console.log(`An error happened ${error}`);
      res.redirect("/admin/orders");
    }
  },

  viewOrderForAdmin: async (req, res) => {
    try {
      const orderId = req.params.id;
      const orderDetails = await Order.findById(orderId).lean();
      const productDetails = await Order.findById({ _id: orderId })
        .populate("Products.ProductId")
        .lean();
  
      const userId = orderDetails.UserId;
      const userDetails = await User.findById(userId).lean();
      const products = productDetails.Products;
  
      res.render("admin/order-details", {
        verifiedAdmin: true,
        orderDetails,
        userDetails,
        products,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },
};
