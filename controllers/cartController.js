const Cart = require("../models/cartSchema");
const Product = require("../models/productSchema");
const Coupon = require("../models/couponSchema");
const helper = require("../helpers/userHelper");
const mongoose = require("mongoose");

module.exports = {
  cart: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const cartDetails = await Cart.aggregate([
        {
          $match: {
            UserId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: "$Products",
        },
        {
          $lookup: {
            from: "products",
            localField: "Products.ProductId",
            foreignField: "_id",
            as: "ProductDetails",
          },
        },
        {
          $unwind: "$ProductDetails",
        },
        {
          $project: {
            _id: 1,
            UserId: 1,
            ProductId: "$Products.ProductId",
            Quantity: "$Products.Quantity",
            Size: "$Products.Size",
            ProductName: "$ProductDetails.ProductName",
            BasePrice: "$ProductDetails.BasePrice",
            SellingPrice: "$ProductDetails.SellingPrice",
            Description: "$ProductDetails.Description",
            BrandName: "$ProductDetails.BrandName",
            Images: "$ProductDetails.images",
          },
        },
      ]);
  
      let total = 0;
      let payableBeforeDiscount = 0;
      for (const item of cartDetails) {
        total += item.Quantity * item.BasePrice;
        payableBeforeDiscount += item.Quantity * item.SellingPrice;
      }
      let discount = total - payableBeforeDiscount;
  
      // to get payable amount after the offerprice and also discount by coupon
      const payable = await helper.getPrice(userId);
      const cartData = await Cart.findOne({ UserId: userId }).lean();
      let cartDiscount = false;
      if (cartData?.Discount) {
        cartDiscount = true;
      }
      if (total === 0) {
        res.render("user/cart", { user: true, noCart: true });
      } else {
        res.render("user/cart", {
          user: true,
          productsInCart: cartDetails,
          total,
          discount,
          payable,
          cartDiscount,
          cartData,
          message: req.flash(),
        });
      }     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  addToCart: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const productId = req.params.id;
      const quantity = parseInt(1);
      const size = parseInt(req.body.size);
      let cart = await Cart.findOne({ UserId: userId });
      if (cart) {
        let sameProduct = cart.Products.find((item) => {
          return item.ProductId.equals(productId) && item.Size === size;
        });

        if (sameProduct) {
          const check = await Product.findOne(
            {
              _id: sameProduct.ProductId,
              Sizes: {
                $elemMatch: {
                  Size: size,
                },
              },
            },
            {
              "Sizes.$": 1,
            }
          );

          if (sameProduct.Quantity >= check.Sizes[0].Quantity) {
            req.flash(
              "lowStock",
              "No more quantity available in this certain item"
            );
          } else {
            const updateCart = await Cart.findOneAndUpdate(
              {
                UserId: userId,
                Products: {
                  $elemMatch: {
                    ProductId: productId,
                    Size: size,
                  },
                },
              },
              {
                $inc: {
                  "Products.$.Quantity": 1,
                },
              }
            );
          }
        } else {
          const updateCart = await Cart.findOneAndUpdate(
            {
              UserId: userId,
            },
            {
              $push: {
                Products: {
                  ProductId: productId,
                  Quantity: quantity,
                  Size: size,
                },
              },
            }
          );
        }
      } else {
        req.body.UserId = userId;
        req.body.Total = 0;
        let products = [
          {
            ProductId: productId,
            Quantity: quantity,
            Size: size,
          },
        ];
        req.body.Products = products;
        const newUserCart = await Cart.create(req.body);
      }
      res.redirect("/cart");
    } catch (error) {
      console.log(`${error}`);
      res.redirect("/cart");
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const { productId, size, change } = req.body;
      const userId = req.session.user.user;
      const userCart = await Cart.findOne({ UserId: userId });
      const product = await Product.findById(productId);
      if (!userCart || !product) {
        return res.status(404).json({ error: "product or cart is not there" });
      }
      const cartItem = userCart.Products.find((item) => {
        return item.ProductId.equals(productId) && item.Size === parseInt(size);
      });
      if (!cartItem) {
        return res.status(404).json({ error: "product or cart is not there" });
      }
      const newQuantity = parseInt(cartItem.Quantity) + parseInt(change);
      cartItem.Quantity = newQuantity;
      let availableqty;
      for (const item of product.Sizes) {
        if (item.Size == parseInt(size)) {
          availableqty = item.Quantity;
        }
      }

      let outOfStock = false;
      if (availableqty < newQuantity) {
        outOfStock = true;
      } else {
        await userCart.save();
      }
      const total = await helper.getTotal(userId);
      const payable = await helper.getPrice(userId);
      const discount = total - payable;
      return res.json({
        message: "success",
        newQuantity,
        total,
        payable,
        discount,
        outOfStock,
      });
    } catch (error) {
      console.log(error);
    }
  },

  checkDeleteCartItem: async (req, res) => {
    try {
      const userId = req.session?.user?.user;
      const productId = req.body.productId;
      const quantity = req.body.quantity;
      const cart = await Cart.findOne({ UserId: userId });
      if (cart?.Discount) {
        const couponId = cart.CouponId;
        const existCouponDetails = await Coupon.findOne({ _id: couponId });
        const productDetails = await Product.findOne({ _id: productId });
        const totalCartAmount = await helper.getPrice(userId);
        const priceToDecrease = productDetails.SellingPrice * quantity;
        const priceGoingToBe = totalCartAmount + cart.Discount - priceToDecrease;
        if (priceGoingToBe < existCouponDetails.MinOrderAmount) {
          res.json({ couponWillLoose: true });
        } else {
          res.json({ conditionSatisfied: true });
        }
      } else {
        res.json({ conditionSatisfied: true });
      }     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  deleteCartItem: async (req, res) => {
    try {
      const userId = req.session?.user?.user;
      const productId = req.body.productId;
      const size = req.body.size;
      const cart = await Cart.findOne({ UserId: userId });
      if (cart.Products.length < 2) {
        const deleteItem = await Cart.findOneAndDelete({ UserId: userId });
      } else {
        const deleteItem = await Cart.findOneAndUpdate(
          { UserId: userId },
          {
            $pull: {
              Products: {
                ProductId: productId,
                Size: size,
              },
            },
          }
        );
      }
      res.json({ deleted: true });   
    } catch (error) {
      console.log(error,'error happened');
    }
  },
};
