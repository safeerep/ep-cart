const Products = require("../models/productSchema");
const Wishlist = require("../models/wishListSchema");
const mongoose = require("mongoose");

module.exports = {
  wishlist: async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.session.user.user);
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 4;
      const listItems = await Wishlist.findOne({ UserId: userId })
        .populate("ProductsId")
        .lean();

      const totalCount = listItems?.ProductsId?.length;
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

      let noList = false;
      let allItems = [];
      if (!listItems) {
        noList = true;
      } else {
        allItems = listItems.ProductsId;
      }
      const itemslist = allItems?.slice(
        previousPage * perPage,
        currentPage * perPage
      );

      res.render("user/wishlist", {
        user: true,
        itemslist,
        noList,
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
      console.log(error, "error happened");
    }
  },

  addToWishlist: async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.session.user.user);
      const productId = new mongoose.Types.ObjectId(req.body.productId);
      const userWishlist = await Wishlist.findOne({ UserId: userId });
      if (userWishlist) {
        const sameItem = userWishlist.ProductsId.some((item) =>
          item.equals(productId)
        );
        if (sameItem) {
          console.log(`Item already exists in the wishlist.`);
        } else {
          const updatedWishlist = await Wishlist.findOneAndUpdate(
            { UserId: userId },
            { $push: { ProductsId: productId } },
            { new: true }
          );
        }
      } else {
        const wishlist = new Wishlist({
          UserId: userId,
          ProductsId: [productId],
        });
        wishlist.save();
      }
      const response = {
        success: true,
        productId,
      };
      res.json(response);
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  removeItem: async (req, res) => {
    try {
      const productId = req.params.id;
      const userId = req.session.user.user;
      const removedItem = await Wishlist.findOneAndUpdate(
        {
          UserId: userId,
        },
        {
          $pull: {
            ProductsId: productId,
          },
        }
      );
      res.redirect("/wishlist");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  sizesToAdd: async (req, res) => {
    try {
      const productId = req.params.id;
      const certainProduct = await Products.findOne({ _id: productId });
      const sizesAvailable = [];
      for (let item of certainProduct.Sizes) {
        if (item.Quantity > 0) {
          sizesAvailable.push(item.Size);
        } else {
          continue;
        }
      }
      let availability = true;
      if (!sizesAvailable.length) {
        availability = false;
      }

      res.json({ sizesAvailable, availability });
    } catch (error) {
      console.log(error, "error happened");
    }
  },
};
