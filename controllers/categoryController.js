const adminHelper = require("../helpers/adminHelper");
const Category = require("../models/categorySchema");
const mongoose = require("mongoose");

module.exports = {
  // admin
  // category
  categories: async (req, res) => {
    try {  
      const category = req.query.Category || "";
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 4;
      const skip = (currentPage - 1) * perPage;
  
      const totalCount = await Category.countDocuments().lean();
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
  
      const categories = await Category.find({
        CategoryName: {
          $regex: category,
          $options: "i",
        },
      })
        .skip(skip)
        .limit(perPage)
        .lean();
  
      res.render("admin/categories", {
        verifiedAdmin: true,
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
      console.log(error,'error happened');
    }
  },

  addCategoryPage: async (req, res) => {
    try {
      res.render("admin/add-categories", {
        verifiedAdmin: true,
        message: req.flash(),
      });     
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  addCategory: async (req, res) => {
    try {
      req.body.Image = req.file.filename;
      adminHelper.cropImages([req.body.Image])
      const newCategory = await Category.create(req.body);
      res.redirect("/admin/product-categories");
    } catch (error) {
      if (error.code === 11000) {
        req.flash("error", "category is already existing");
        res.redirect("/admin/add-category");
      } else {
        console.log(`An error happened ${error}`);
      }
    }
  },

  editCategory: async (req, res) => {
    try {
      const id = new mongoose.Types.ObjectId(req.params.id);
      const categoryDetails = await Category.findById(id).lean();
      res.render("admin/edit-category", {
        verifiedAdmin: true,
        categoryDetails,
        message: req.flash(),
      });    
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  updateCategory: async (req, res) => {
    try {
      const id = req.params.id;
      if (req.file) {
        req.body.Image = req.file.filename;
      }
      if (req.body.Image) {
        adminHelper.cropImages([req.body.Image])
      }
      const updatedCategory = await Category.findByIdAndUpdate(id, {
        ...req.body,
      });

      res.redirect("/admin/product-categories");
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },
};
