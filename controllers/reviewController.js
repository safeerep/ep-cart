const Reviews = require("../models/reviewSchema");
const User = require("../models/userSchema");
const mongoose = require("mongoose");
const moment = require("moment");
const { response } = require("express");

module.exports = {
  postReview: async (req, res) => {
    try {
      req.body.UserId = new mongoose.Types.ObjectId(req.session.user.user);
      const productId = new mongoose.Types.ObjectId(req.body.ProductId);
      req.body.Date = moment(new Date()).format("lll");
      const existing = await Reviews.findOne({
        UserId: req.body.UserId,
        ProductId: req.body.ProductId,
      });
      if (existing) {
        await Reviews.findOneAndUpdate(
          {
            UserId: req.body.UserId,
            ProductId: req.body.ProductId,
          },
          {
            ...req.body,
          }
        );
      } else {
        const newComment = await Reviews.create(req.body);
      }
      const userData = await User.findById(req.body.UserId);
      let userName = "User";
      if (userData?.Name) {
        userName = userData.Name;
      }
      const reviews = await Reviews.find({ ProductId: productId }).lean();
      const userInfo = await Reviews.aggregate([
        {
          $match: {
            ProductId: productId,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "UserId",
            foreignField: "_id",
            as: "usersData",
          },
        },
        {
          $unwind: "$usersData",
        },
        {
          $project: {
            "usersData.Name": 1,
          },
        },
      ]);
      const users = userInfo.map((item) =>
        item.usersData.Name ? item.usersData.Name : "user"
      );
      const response = {
        reviews,
        users,
      };
      res.json(response);    
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  rateProduct: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const productId = req.body.ProductId;
      const rating = req.body.Rating;
      const existDocument = await Reviews.findOne({
        UserId: userId,
        ProductId: productId,
      });

      if (existDocument) {
        await Reviews.findOneAndUpdate(
          {
            UserId: userId,
            ProductId: productId,
          },
          {
            Rating: rating,
          }
        );
      } else {
        req.body.UserId = userId;
        req.body.Date = moment(new Date()).format("lll");
        await Reviews.create(req.body);
      }

      res.json({ success: true });
    } catch (error) {
      console.log(`an error happened${error}`);
    }
  },

  // admin - manage reviews
  reviews: async (req, res) => {
    try {
      // const productId = req.params.productId || '';
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 5;
      const skip = (currentPage - 1) * perPage;
  
      const totalCount = await Reviews.countDocuments().lean();
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
  
      let reviews;
      if (req.url === "/reviews") {
        reviews = await Reviews.find()
          .sort({ _id: -1 })
          .skip(skip)
          .limit(perPage)
          .lean();
      }
      if (req.url === "/reviews/oldest") {
        reviews = await Reviews.find()
          .skip(skip)
          .limit(perPage)
          .lean();
      }
      res.render("admin/reviews", {
        verifiedAdmin: true,
        reviews,
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

  deleteReview: async (req, res) => {
    try {
      const reviewId = req.params.id;
      const deleteReview = await Reviews.findByIdAndDelete(reviewId);
      res.redirect(`/admin/product-reviews/${deleteReview.ProductId}`);     
    } catch (error) {
      console.log(error,'error happened');
    }
  },
};
