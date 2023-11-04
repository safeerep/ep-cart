const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const Review = require("../models/reviewSchema");
const mongoose = require("mongoose");
const moment = require("moment");
const adminHelper = require("../helpers/adminHelper");

module.exports = {
  shop: async (req, res) => {
    try {
      const Search = req.query.Search || "";
      const sort = req.query.sort || "";
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 3;
      const skip = (currentPage - 1) * perPage;

      const totalCount = await Product.countDocuments({
        Display: "Active",
        ProductName: {
          $regex: Search,
          $options: "i",
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
      const categories = await Category.find().lean();
      
      let condition;
      if (sort === "a") {
        condition = { ProductName: 1 };
      } else if (sort === "z") {
        condition = { ProductName: -1 };
      } else if (sort === "l") {
        condition = { SellingPrice: 1 };
      } else if (sort === "h") {
        condition = { SellingPrice: -1 };
      } else {
        condition = { _id: 1 };
      }

      const products = await Product.find({
        Display: "Active",
        ProductName: {
          $regex: Search,
          $options: "i",
        },
      })
        .sort(condition)
        .skip(skip)
        .limit(perPage)
        .lean();

      res.render("user/shop", {
        user: true,
        products,
        categories,
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
      res.redirect('/shop')
    }
  },

  shopCategory: async (req, res) => {
    try {
      const categoryId = req.query.Category;
      const sort = req.query.sort;
      const catId = new mongoose.Types.ObjectId(categoryId);
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await Product.countDocuments({
        Display: "Active",
        Category: catId,
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

      const currentCategory = await Category.findOne({
        _id: categoryId,
      }).lean();
      const categories = await Category.find({
        _id: { $ne: categoryId },
      }).lean();
      let condition;
      if (sort === "a") {
        condition = { ProductName: 1 };
      } else if (sort === "z") {
        condition = { ProductName: -1 };
      } else if (sort === "l") {
        condition = { SellingPrice: 1 };
      } else if (sort === "h") {
        condition = { SellingPrice: -1 };
      } else {
        condition = { _id: 1 };
      }
      const products = await Product.find({
        Display: "Active",
        Category: catId,
      })
        .sort(condition)
        .skip(skip)
        .limit(perPage)
        .lean();

      res.render("user/shop", {
        user: true,
        products,
        currentCategory,
        categories,
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

  productView: async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.session?.user?.user;
      if (!userId) {
        res.redirect("/home");
      } else {
        const certainProduct = await Product.findById(id).lean();
        const userHasBoughtProduct = await Order.findOne({
          UserId: userId,
          "Products.ProductId": id,
          Status: "Delivered",
        });

        let offerPrice = false;
        if (certainProduct.SellingPrice < certainProduct.BasePrice) {
          offerPrice = true;
        }

        let accessToWriteReview = false;
        if (userHasBoughtProduct) {
          accessToWriteReview = true;
        }

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

        const comments = await Review.find({
          ProductId: id,
          Comment: {
            $ne: null,
          },
        })
          .sort({ _id: -1 })
          .lean();
        const userInfo = await Review.aggregate([
          {
            $match: {
              ProductId: new mongoose.Types.ObjectId(id),
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

        const reviews = comments.map((comment, index) => {
          return {
            user: users[index],
            review: comment.Comment,
          };
        });

        const ratings = await Review.aggregate([
          {
            $match: {
              ProductId: new mongoose.Types.ObjectId(id),
              Rating: { $exists: true },
            },
          },
          {
            $group: {
              _id: null,
              totalRatings: { $sum: "$Rating" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalRatings: 1,
              count: 1,
              totalRatingPercentage: { $multiply: ["$count", 5] },
            },
          },
          {
            $project: {
              averageRating: {
                $divide: ["$totalRatings", "$totalRatingPercentage"],
              },
            },
          },
        ]);
        const averageRating =
          Math.ceil((ratings[0]?.averageRating * 10) / 2) || 0;
        let stars = [];
        let currentUserStars = [];
        const currentUserReview = await Review.findOne({
          UserId: userId,
          ProductId: id,
        });

        const currentUserRating = currentUserReview?.Rating || 0;
        for (let i = 1; i < 6; i++) {
          if (averageRating >= i) {
            stars.push(true);
          } else if (averageRating < i) {
            stars.push(false);
          }
          if (currentUserRating >= i) {
            currentUserStars.push(true);
          } else if (currentUserRating < i) {
            currentUserStars.push(false);
          }
        }

        res.render("user/product-view", {
          user: true,
          certainProduct,
          offerPrice,
          sizesAvailable,
          availability,
          accessToWriteReview,
          reviews,
          stars,
          currentUserStars,
        });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  availabilityCheck: async (req, res) => {
    try {
      const userId = req.session?.user?.user;
      if (!userId) {
        res.redirect("/home");
      } else {
        const userCart = await Cart.findOne({ UserId: userId });

        const notAvailableProducts = [];
        for (let product of userCart.Products) {
          let checkingProduct = await Product.findOne({
            _id: product.ProductId,
          });
          const available = checkingProduct?.Sizes.find(
            (item) => item.Size === product.Size
          );

          const availableQuantity = available?.Quantity || 0;
          if (availableQuantity < product.Quantity) {
            const certainItem = {
              productId: product.ProductId,
              size: product.Size,
            };
            notAvailableProducts.push(certainItem);
          }
        }

        if (notAvailableProducts.length) {
          res.json({ someProductsNotAvailable: true, notAvailableProducts });
        } else {
          res.json({ everythingIsOk: true });
        }
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  // admin
  productPage: async (req, res) => {
    try {
      const Search = req.query.Search || "";
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 10;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await Product.countDocuments().lean();
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

      const productData = await Product.find({
        ProductName: {
          $regex: Search,
          $options: "i",
        },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();

      const stock = [];
      for (let pro of productData) {
        let stockIn = 0;
        for (const size of pro.Sizes) {
          if (0 < size.Quantity) {
            stock.push(true);
            stockIn = 1;
            break;
          }
        }
        if (stockIn === 0) {
          stock.push(false);
        }
      }

      const productDetails = productData.map((product, index) => {
        return {
          ...product,
          stock: stock[index],
        };
      });

      res.render("admin/products", {
        verifiedAdmin: true,
        productDetails,
        stock,
        totalCount,
        currentPage,
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

  addProductPage: async (req, res) => {
    try {
      const categories = await Category.find().lean();
      res.render("admin/add-product", { verifiedAdmin: true, categories });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addProduct: async (req, res) => {
    try {
      const images = [];
      for (let i = 1; i < 4; i++) {
        const fieldName = `image${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          images.push(req.files[fieldName][0].filename);
        }
      }
      adminHelper.cropImages(images);
      const category = await Category.findOne({
        CategoryName: req.body.Category,
      });

      const variations = [];
      const sizeArray = req.body.Size || [];

      for (const size of sizeArray) {
        const quantityKey = `SizeQuantity${size}`;
        const quantity = req.body[quantityKey];
        const variation = {
          Size: parseInt(size, 10),
          Quantity: quantity,
        };
        variations.push(variation);
      }

      req.body.BasePrice = Math.abs(req.body.BasePrice);
      req.body.SellingPrice = Math.abs(req.body.SellingPrice);
      const str = req.body.Tags;
      req.body.Tags = str.split(",");
      req.body.Sizes = variations;
      req.body.Status = "In stock";
      req.body.images = images;
      req.body.Display = "Active";
      req.body.Category = category._id;
      req.body.UpdatedOn = moment(new Date()).format("lll");
      const uploaded = await Product.create(req.body);
      res.redirect("/admin/products");
    } catch (error) {
      console.log(`An error happened ${error}`);
    }
  },

  banProduct: async (req, res) => {
    try {
      const id = req.params.id;
      let foundProduct = await Product.findById(id).lean();
      if (foundProduct.Display === "Active") {
        await Product.findByIdAndUpdate(id, {
          Display: "Blocked",
        });
      } else {
        await Product.findByIdAndUpdate(id, {
          Display: "Active",
        });
      }
      res.redirect("/admin/products");
    } catch (err) {
      console.log(err);
    }
  },

  editProductDetails: async (req, res) => {
    try {
      const id = req.params.id;
      const productDetails = await Product.findById(id).lean();
      const sizesToCheck = [5, 6, 7, 8, 9, 10];
      const Sizes = productDetails.Sizes;

      const sizesAvailable = sizesToCheck.map((sizeToCheck) => {
        const matchingSize = Sizes.find(
          (sizeObj) => sizeObj.Size === sizeToCheck
        );
        if (matchingSize) {
          return { Size: sizeToCheck, Quantity: matchingSize.Quantity };
        } else {
          return { Size: sizeToCheck, Quantity: 0 };
        }
      });

      const currentCategory = await Category.findOne({
        _id: productDetails.Category,
      }).lean();
      const categories = await Category.find({
        _id: { $ne: productDetails.Category },
      }).lean();

      res.render("admin/edit-product-details", {
        verifiedAdmin: true,
        productDetails,
        currentCategory,
        categories,
        sizesAvailable,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  updateProductDetails: async (req, res) => {
    try {
      const id = req.params.id;
      const images = [];
      const existingProduct = await Product.findById(id);
      if (existingProduct) {
        images.push(...existingProduct.images);
      }

      for (let i = 0; i < 3; i++) {
        const fieldName = `image${i + 1}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          images[i] = req.files[fieldName][0].filename;
        }
      }

      adminHelper.cropImages(images);
      req.body.images = images;
      const category = await Category.findOne({
        CategoryName: req.body.Category,
      });
      req.body.Category = category._id;

      req.body.BasePrice = Math.abs(req.body.BasePrice);
      req.body.SellingPrice = Math.abs(req.body.SellingPrice);
      const variations = [];
      const sizeArray = req.body.Size || [];
      for (const size of sizeArray) {
        const quantityKey = `SizeQuantity${size}`;
        const quantity = req.body[quantityKey];
        const variation = {
          Size: parseInt(size, 10),
          Quantity: quantity,
        };
        variations.push(variation);
      }

      req.body.Sizes = variations;
      req.body.UpdatedOn = moment(new Date()).format("lll");
      const updates = req.body;
      const updatedProductDetails = await Product.findByIdAndUpdate(id, {
        ...updates,
      });
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  viewReviews: async (req, res) => {
    try {
      const productId = req.params.id;
      const comments = await Review.find({ ProductId: productId })
        .sort({ _id: -1 })
        .lean();
      const userInfo = await Review.aggregate([
        {
          $match: {
            ProductId: new mongoose.Types.ObjectId(productId),
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
      const reviews = comments.map((comment, index) => {
        return {
          user: users[index],
          review: comment.Comment,
          id: comment._id,
        };
      });
      res.render("admin/product-reviews", {
        verifiedAdmin: true,
        reviews,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },
};
