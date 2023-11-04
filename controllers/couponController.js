const Coupons = require("../models/couponSchema");
const Cart = require("../models/cartSchema");
const Users = require("../models/userSchema");
const Products = require("../models/productSchema");
const userHelper = require("../helpers/userHelper");

module.exports = {
  coupons: async (req, res) => {
    try {
      const counponName = req.query.CouponName || '';
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 5;
      const skip = (currentPage - 1) * perPage;
  
      const totalCount = await Coupons.countDocuments().lean();
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
      const coupons = await Coupons.find({CouponName: {
        $regex: counponName,
        $options: "i",
      },})
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
      res.render("admin/coupons", {
        verifiedAdmin: true,
        coupons,
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

  addCouponPage: (req, res) => {
    try {
      res.render("admin/add-coupon", {
        verifiedAdmin: true,
        message: req.flash()
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  addCoupon: async (req, res) => {
    try {
      req.body.CreatedOn = new Date();
      req.body.ExpireDate = new Date(req.body.ExpireDate).toISOString();
      req.body.Active = true;
      req.body.UsedBy = [];
      const newCoupon = await Coupons.create(req.body);
      res.redirect("/admin/coupons");      
    } catch (error) {
      if (error.code === 11000) {
        req.flash("error", "A coupon already exists with this coupon code")
        res.redirect('/admin/add-coupon')
      }
    }
  },

  disableCoupon: async (req, res) => {
    try {
      const couponId = req.params.id;
      const updateCoupon = await Coupons.findByIdAndUpdate(couponId, {
        Active: false,
      });
      res.redirect("/admin/coupons");      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  enableCoupon: async (req, res) => {
    try {
      const couponId = req.params.id;
      const updateCoupon = await Coupons.findByIdAndUpdate(couponId, {
        Active: true,
      });
      res.redirect("/admin/coupons");      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  editCouponPage: async (req, res) => {
    try {
      const couponId = req.params.id;
      const couponData = await Coupons.findById(couponId).lean();
      let single = false;
      let multi = false;
      if (couponData.Limit === "single") {
        single = true;
      } else {
        multi = true;
      }
      couponData.ExpireDate = new Date(couponData.ExpireDate).toISOString().split('T')[0];
  
      res.render("admin/edit-coupon", {
        verifiedAdmin: true,
        couponData,
        single,
        multi,
      });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  editCoupon: async (req, res) => {
    try {
      const couponId = req.params.id;
      req.body.ExpireDate = new Date(req.body.ExpireDate).toISOString();
      const updateCoupon = await Coupons.findByIdAndUpdate(couponId, {
        ...req.body,
      });
      res.redirect("/admin/coupons");      
    } catch (error) {
      console.log(error,'error happened');
    }
  },


  // users

  availableOffers: async (req, res) => {
    try {
      const offers = await Coupons.find({ExpireDate: {$lte: new Date()}, Active: true}).lean()
      const userId = req.session?.user?.user;
      const userData = await Users.findOne({_id: userId}).lean()
      res.render('user/coupons-and-offers', {
        user: true,
        userData,
        offers
      })      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  applyCoupon: async (req, res) => {
    try {
      
      const couponCode = req.body.CouponCode;
      const userId = req.session.user.user;
      const findCoupon = await Coupons.findOne({
        CouponCode: couponCode,
        Active: true,
      });
      if (findCoupon) {
        const cartAmountPayable = await userHelper.getPrice(userId);
        if (findCoupon.MinOrderAmount < cartAmountPayable) {
          if (findCoupon.Limit === "single") {
            // single time coupon
            const used = findCoupon.UsedBy.includes(userId);
            if (used) {
              res.json({ alreadyUsed: true });
            } else {
              const anyCouponExist = await Cart.findOne({ UserId: userId });
              if (anyCouponExist?.Discount > 0) {
                res.json({ oneCouponExist: true });
              }
              else {
                const couponDiscount = findCoupon.Discount;
                const couponId = findCoupon._id;
                const updateUserCart = await Cart.findOneAndUpdate(
                  {
                    UserId: userId,
                  },
                  {
                    Discount: couponDiscount,
                    CouponId: couponId
                  }
                );
                const priceAfterCouponApplied = await userHelper.getPrice(userId);
                const updateCouponDoc = await Coupons.findOneAndUpdate(
                  {
                    CouponCode: couponCode,
                  },
                  {
                    $push: {
                      UsedBy: userId,
                    },
                  }
                );
                res.json({
                  couponFoundAndAbleToApply: true,
                  priceAfterCouponApplied,
                  couponDiscount,
                });
              }
            }
          } else {
            // multiple time usable coupon
            const couponDiscount = findCoupon.Discount;
            const couponId = findCoupon._id;
            const anyCouponExist = await Cart.findOne({ UserId: userId });
            if (anyCouponExist?.Discount > 0) {
              res.json({ oneCouponExist: true });
            }
            else {
              const updateUserCart = await Cart.findOneAndUpdate(
                {
                  UserId: userId,
                },
                {
                  Discount: couponDiscount,
                  CouponId: couponId,
                }
              );
  
              const priceAfterCouponApplied = await userHelper.getPrice(userId);
              const updateCouponDoc = await Coupons.findOneAndUpdate(
                {
                  CouponCode: couponCode,
                },
                {
                  $push: {
                    UsedBy: userId,
                  },
                }
              );
              res.json({
                couponFoundAndAbleToApply: true,
                priceAfterCouponApplied,
                couponDiscount,
              });
            }
          }
        } else {
          res.json({ orderAmountNotEnough: true });
        }
      } else {
        // coupon not found
        res.json({ couponNotFound: true });
      }
    } catch (error) {
      console.log(error,'error happened');     
    }
  },

  applyAnotherCoupon: async (req, res) => {
    try {
      const couponCode = req.body.CouponCode;
      const userId = req.session.user.user;
      const findCoupon = await Coupons.findOne({
        CouponCode: couponCode,
        Active: true,
      });
      const couponDiscount = findCoupon.Discount;
      const couponId = findCoupon._id;
      const updateUserCart = await Cart.findOneAndUpdate(
        {
          UserId: userId,
        },
        {
          Discount: couponDiscount,
          CouponId: couponId,
        }
      );

      const priceAfterCouponApplied = await userHelper.getPrice(userId);
      const updateCouponDoc = await Coupons.findOneAndUpdate(
        {
          CouponCode: couponCode,
        },
        {
          $push: {
            UsedBy: userId,
          },
        }
      );
      res.json({
        couponFoundAndAbleToApply: true,
        priceAfterCouponApplied,
        couponDiscount,
      });
    } catch (error) {
      res.json({ anError: true });
    }
  },

  checkCouponValidity: async (req, res) => {
    try {
      const userId = req.session?.user?.user;
      const productId = req.body.productId
      const userCart = await Cart.findOne({UserId: userId})
      const couponId = userCart.CouponId;
      if (userCart.Discount) {
        const existCouponDetails = await Coupons.findOne({_id: couponId})
        const productDetails = await Products.findOne({_id: productId})
        const totalCartAmount = await userHelper.getPrice(userId);
        const priceGoingToBe = (totalCartAmount + userCart.Discount) - productDetails.SellingPrice;
        if (priceGoingToBe < existCouponDetails.MinOrderAmount) {
          res.json({couponWillLoose: true})
        }
        else {
          res.json({conditionSatisfied: true})
        }
      }
      else {
        res.json({conditionSatisfied: true})
      }     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  deleteCouponFromCart: async (req, res) => {
    try {
      const userId = req.session?.user?.user;
      const userCart = await Cart.findOneAndUpdate(
        {
          UserId: userId
        },
        {
          Discount: 0
        }
      )

      res.json({success: true})
    } catch (error) {
      res.json({failed: true})
    }
  },
};
