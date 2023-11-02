const adminHelper = require("../helpers/adminHelper");
const Banners = require("../models/bannerSchema");

module.exports = {
  banners: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 3;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await Banners.countDocuments().lean();
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
      const banners = await Banners.find().skip(skip).limit(perPage).lean();
  
      res.render("admin/banners", {
        verifiedAdmin: true,
        banners,
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

  addBannerPage: async (req, res) => {
    try {
      const banners = await Banners.find().lean();
      res.render("admin/add-banners", { verifiedAdmin: true, banners });      
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  addBanner: async (req, res) => {
    try {
      req.body.Image = req.file.filename;
      req.body.Status = true;
      adminHelper.cropImageForBanner(req.body.Image)
      const newBanner = await Banners.create(req.body);
      res.redirect("/admin/banners");    
    } catch (error) {
      console.log(error,'error happened');
    }
  },

  editStatus: async (req, res) => {
    try {
      const bannerId = req.query.bannerId;
      const status = req.query.status;
      if (status === "true") {
        const updateBannerStatus = await Banners.findByIdAndUpdate(bannerId, {
          Status: false,
        });
      } else {
        const updateBannerStatus = await Banners.findByIdAndUpdate(bannerId, {
          Status: true,
        });
      }
      res.redirect("/admin/banners");      
    } catch (error) {
      console.log(error,'error happened');
    }
  },
};
