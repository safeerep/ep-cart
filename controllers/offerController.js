const Products = require("../models/productSchema");
const Offers = require("../models/offerSchema");
const Category = require("../models/categorySchema");
const RefferalOffer = require("../models/refferalOfferSchema");

module.exports = {
  offers: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 5;
      const skip = (currentPage - 1) * perPage;

      const totalCount = await Offers.countDocuments().lean();
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
      const offers = await Offers.find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
      const refferalOffer = await RefferalOffer.findOne().lean();
      res.render("admin/offers", {
        verifiedAdmin: true,
        refferalOffer,
        offers,
        currentPage,
        totalCount,
        startIndex,
        endIndex,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
        message: req.flash(),
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addOfferPage: async (req, res) => {
    try {
      const categories = await Category.find().lean();
      res.render("admin/add-offer", {
        verifiedAdmin: true,
        categories,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addOffer: async (req, res) => {
    try {
      req.body.Active = true;
      const newOffer = await Offers.findOneAndUpdate(
        {
          CategoryName: req.body.CategoryName,
        },
        {
          ...req.body,
        },
        {
          upsert: true,
          new: true,
        }
      );
      const discountAmount = parseInt(req.body.Discount);
      const category = await Category.findOne({
        CategoryName: req.body.CategoryName,
      });
      const updateProducts = await Products.updateMany(
        {
          Category: category._id,
        },
        {
          $inc: {
            SellingPrice: -discountAmount,
          },
        }
      );

      //to delete the category offer after the specified date
      const deleteDate = new Date(newOffer.ExpireDate);

      // function to check the date and remove the offer, if the date is reached
      function checkTimeAndRemoveOffer() {
        const currentDate = new Date();
        if (currentDate >= deleteDate) {
          removeOffer();
        } else {
          setTimeout(checkTimeAndRemoveOffer, 1000);
        }
      }

      async function removeOffer() {
        const updateProducts = await Products.updateMany(
          {
            Category: category._id,
          },
          {
            $inc: {
              SellingPrice: discountAmount,
            },
          }
        );
        const updateOfferDocument = await Offers.findByIdAndUpdate(
          {
            _id: newOffer._id,
          },
          {
            Active: false,
          }
        );
        console.log(`offer removed on ${deleteDate}`);
      }

      // checking for the delete date
      checkTimeAndRemoveOffer();
      res.redirect("/admin/offers");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  disableOffer: async (req, res) => {
    try {
      const offerId = req.params.id;
      const offerDetails = await Offers.findByIdAndUpdate(offerId, {
        Active: false,
      });
      const discountAmount = offerDetails.Discount;
      const category = await Category.findOne({
        CategoryName: offerDetails.CategoryName,
      });
      const updateProducts = await Products.updateMany(
        {
          Category: category._id,
        },
        {
          $inc: {
            SellingPrice: discountAmount,
          },
        }
      );
      res.redirect("/admin/offers");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  enableOffer: async (req, res) => {
    try {
      const offerId = req.params.id;
      const offerDetails = await Offers.findById(offerId);
      const offerExpireDate = new Date(offerDetails.ExpireDate);
      const currentDate = new Date();

      if (currentDate >= offerExpireDate) {
        req.flash("error: change the expiry date first and try again");
        res.redirect("admin/offers");
      } else {
        const offerDetailsUpdate = await Offers.findByIdAndUpdate(offerId, {
          Active: true,
        });
        const discountAmount = offerDetails.Discount;
        const category = await Category.findOne({
          CategoryName: offerDetails.CategoryName,
        });
        const updateProducts = await Products.updateMany(
          {
            Category: category._id,
          },
          {
            $inc: {
              SellingPrice: -discountAmount,
            },
          }
        );
        res.redirect("/admin/offers");
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  editOfferPage: async (req, res) => {
    try {
      const offerId = req.params.id;
      const offerDetails = await Offers.findById(offerId).lean();
      const currentCategory = offerDetails.CategoryName;
      const categories = await Category.find({
        CategoryName: { $ne: currentCategory },
      }).lean();
      res.render("admin/edit-offer", {
        verifiedAdmin: true,
        offerDetails,
        currentCategory,
        categories,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  editOffer: async (req, res) => {
    try {
      req.body.Active = true;
      const oldOffer = await Offers.findOneAndUpdate(
        {
          CategoryName: req.body.CategoryName,
        },
        {
          ...req.body,
        },
        {
          upsert: true,
        }
      );
      const discountAmount = parseInt(req.body.Discount);
      const category = await Category.findOne({
        CategoryName: req.body.CategoryName,
      });
      let newDiscountAmount;
      if (oldOffer.Active === true) {
        newDiscountAmount = oldOffer.Discount - discountAmount;
      } else {
        newDiscountAmount = -discountAmount;
      }
      const updateProducts = await Products.updateMany(
        {
          Category: category._id,
        },
        {
          $inc: {
            SellingPrice: newDiscountAmount,
          },
        }
      );

      //to delete the category offer after the specified date
      const updatedOffer = await Offers.findOne({
        CategoryName: category.CategoryName,
      });
      const deleteDate = new Date(updatedOffer.ExpireDate);

      // function to check the date and remove the offer, if the date is reached
      function checkTimeAndRemoveOffer() {
        const currentDate = new Date();
        if (currentDate >= deleteDate) {
          removeOffer();
        } else {
          setTimeout(checkTimeAndRemoveOffer, 1000);
        }
      }

      async function removeOffer() {
        const updateProducts = await Products.updateMany(
          {
            Category: category._id,
          },
          {
            $inc: {
              SellingPrice: discountAmount,
            },
          }
        );
        const updateOfferDocument = await Offers.findByIdAndUpdate(
          {
            _id: updatedOffer._id,
          },
          {
            Active: false,
          }
        );
        console.log(`offer removed on ${deleteDate}`);
      }
      // checking for the delete date
      checkTimeAndRemoveOffer();

      res.redirect("/admin/offers");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addRefferalOfferPage: async (req, res) => {
    try {
      res.render("admin/add-refferal-offer", { verifiedAdmin: true });
    } catch (error) {
      res.redirect("/admin/offers");
    }
  },

  addRefferalOffer: async (req, res) => {
    console.log("reached");
    req.body.Active = true;
    const referralOffer = await RefferalOffer.create(req.body);
    res.redirect("/admin/offers");
  },

  enableRefferalOffer: async (req, res) => {
    const refferalOfferId = req.params.id;
    const refferalOffer = await RefferalOffer.findOneAndUpdate(
      {
        _id: refferalOfferId,
      },
      {
        Active: true,
      }
    );
    res.redirect("/admin/offers");
  },

  disableRefferalOffer: async (req, res) => {
    const refferalOfferId = req.params.id;
    const refferalOffer = await RefferalOffer.findOneAndUpdate(
      {
        _id: refferalOfferId,
      },
      {
        Active: false,
      }
    );
    res.redirect("/admin/offers");
  },

  editRefferalOfferPage: async (req, res) => {
    try {
      const refferalOffer = await RefferalOffer.findOne().lean()
      res.render("admin/add-refferal-offer", { 
        verifiedAdmin: true, 
        refferalOffer,
      });
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },

  editRefferalOffer: async (req, res) => {
    try {
      const refferalOfferId = req.params.id;
      const updateRefferalOffer = await RefferalOffer.findOneAndUpdate(
        {
          _id: refferalOfferId,
        },
        {
          ...req.body,
        }
      );
      res.redirect("/admin/offers");
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },
};
