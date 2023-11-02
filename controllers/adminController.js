const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Order = require("../models/orderSchema");
const adminHelper = require("../helpers/adminHelper");
const path = require('path')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
require("dotenv").config();
const nodeMailer = require("../services/nodeMailer");

module.exports = {
  dashboard: async (req, res) => {
    try {
      const topTenProducts = await Order.aggregate([
        {
          $unwind: "$Products",
        },
        {
          $group: {
            _id: "$Products.ProductId",
            totalCount: {
              $sum: "$Products.Quantity",
            },
          },
        },
        {
          $sort: {
            totalCount: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
      ]);

      const totalNumberOfSales = topTenProducts.reduce(
        (accumulator, product) => accumulator + product.totalCount,
        0
      );
      const numberOfOrders = await Order.countDocuments();
      const numberOfUsers = await User.countDocuments({ Status: "Active" });

      res.render("admin/dashboard", {
        Name: req.session.Name,
        verifiedAdmin: true,
        topTenProducts,
        totalNumberOfSales,
        numberOfOrders,
        numberOfUsers,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  getDashboardData: async (req, res) => {
    try {
      const filter = req.body.filter;
      if (filter === "day") {
        const currentDate = new Date();
        const today = moment(currentDate).format("MMM D, YYYY h:mm A");
        const startDate = moment(currentDate).subtract(6, "days");
        const sevendaybefore = startDate.format("MMM D, YYYY h:mm A");
        const orders = await Order.aggregate([
          {
            $match: {
              Date: {
                $gt: sevendaybefore,
                $lte: today,
              },
            },
          },
          {
            $addFields: {
              Date: {
                $toDate: "$Date",
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$Date",
                },
              },
              totalAmount: {
                $sum: "$PayableAmount",
              },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ]);
        res.json({ orders });
      } else if (filter === "month") {
        console.log("filter is month");
        const orders = await Order.aggregate([
          {
            $addFields: {
              Date: {
                $toDate: "$Date",
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$Date",
                },
              },
              totalAmount: {
                $sum: "$PayableAmount",
              },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ]);
        res.json({ orders });
      } else {
        console.log("filter is year");
        const orders = await Order.aggregate([
          {
            $addFields: {
              Date: {
                $toDate: "$Date",
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y",
                  date: "$Date",
                },
              },
              totalAmount: {
                $sum: "$PayableAmount",
              },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ]);
        res.json({ orders });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addAdmin: (req, res) => {
    try {
      res.render("admin/add-admin", {
        verifiedAdmin: true,
        error: req.session.error,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  createAdmin: async (req, res) => {
    try {
      req.body.Password = bcrypt.hashSync(req.body.Password, 10);
      req.body.Createdon = moment(new Date()).format("lll");
      req.body.AccessLevel = "Main";
      const newAdmin = await Admin.create(req.body);
      res.redirect("/admin/dashboard");
    } catch (error) {
      if (error.code === 11000) {
        req.flash("error", "An admin already existing with this credentials");
        res.redirect("/admin/add-admin");
      }
    }
  },

  signin: (req, res) => {
    try {
      res.render("admin/login", {
        personNotVerified: true,
        message: req.flash(),
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  home: async (req, res) => {
    try {
      const adminData = await Admin.findOne({ Email: req.body.Email });
      if (adminData) {
        const passwordCheck = await bcrypt.compare(
          req.body.Password,
          adminData.Password
        );
        if (passwordCheck) {
          const accessToken = jwt.sign(
            { admin: adminData._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30d" }
          );
          res.cookie("adminJwt", accessToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          const email = req.body.Email;
          const name = email.split("@")[0];
          req.session.Name = name;
          res.redirect("/admin/dashboard");
        } else {
          req.flash("error", "username or password is incorrect");
          res.redirect("/admin/signin");
        }
      } else {
        req.flash("error", "username or password is incorrect");
        res.redirect("/admin/signin");
      }
    } catch (error) {
      console.log(error);
    }
  },

  forgotPassword: (req, res) => {
    try {
      res.render("admin/forgot-password", {
        personNotVerified: true,
        message: req.flash(),
        Email: req.session.adminEmail,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  sendOTP: async (req, res) => {
    try {
      const adminEmailFound = await Admin.findOne({ Email: req.body.Email });
      if (adminEmailFound) {
        const digits = "0123456789";
        let OTP = "";
        for (let i = 0; i < 4; i++) {
          OTP += digits[Math.floor(Math.random() * 10)];
        }
        const Email = req.body.Email;
        const otpsent = nodeMailer.sendOtp(OTP, Email);
        req.flash("success", "OTP sent successfully");
        req.session.adminEmail = Email;
        req.session.OTP = OTP;
        res.redirect("/admin/forgot-password");
      } else {
        req.flash("error", "Invalid email address");
        res.redirect("/admin/forgot-password");
      }
    } catch (error) {
      req.flash("error", "Invalid email address");
      res.redirect("/admin/forgot-password");
    }
  },

  verifyOTP: (req, res) => {
    try {
      if (req.body.OTP === req.session.OTP) {
        res.redirect("/admin/change-password");
      } else {
        req.flash("error", "OTP is not matching");
        res.redirect("/admin/forgot-password");
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  changePassword: (req, res) => {
    try {
      res.render("admin/password-change", {
        personNotVerified: true,
        message: req.flash(),
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  verifyPassword: async (req, res) => {
    try {
      if (req.body.Password === req.body.ConfirmPassword) {
        const admin = await Admin.findOneAndUpdate(req.session.adminEmail, {
          Password: req.body.Password,
        });
        res.redirect("/admin/dashboard");
      } else {
        req.flash("error", "password is not matching");
        res.redirect("/admin/change-password");
      }
    } catch (error) {
      req.flash("error", "An error happened");
      res.redirect("/admin/change-password");
    }
  },

  logout: (req, res) => {
    try {
      res.clearCookie("adminJwt");
      res.redirect("/admin/signin");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  users: async (req, res) => {
    try {
      const Email = req.query.Email || "";
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 4;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await User.countDocuments().lean();
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

      const users = await User.find({
        Email: {
          $regex: Email,
          $options: "i",
        },
      })
        .skip(skip)
        .limit(perPage)
        .lean();

      res.render("admin/customers", {
        verifiedAdmin: true,
        users,
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

  blockUser: async (req, res) => {
    try {
      const id = req.params.id;
      let updatedUser = await User.findById(id);
      if (updatedUser.Status === "Active") {
        await User.findByIdAndUpdate(id, {
          Status: "Blocked",
        });
      } else {
        await User.findByIdAndUpdate(id, {
          Status: "Active",
        });
      }
      res.redirect("/admin/users-list");
    } catch (err) {
      console.log(err);
    }
  },

  filters: async (req, res) => {
    try {
      if (req.url === "/active-customers") {
        const users = await User.find({ Status: "Active" }).lean();
        res.render("admin/customers", { verifiedAdmin: true, users: users });
      } else if (req.url === "/blocked-customers") {
        const users = await User.find({ Status: "Blocked" }).lean();
        res.render("admin/customers", { verifiedAdmin: true, users: users });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  // admins controlls
  subAdmins: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const previousPage = currentPage - 1;
      const nextPage = currentPage + 1;
      const perPage = 3;
      const skip = (currentPage - 1) * perPage;
      const totalCount = await Admin.countDocuments({
        AccessLevel: "Sub-admin",
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
      const admins = await Admin.find({ AccessLevel: "Sub-admin" })
        .skip(skip)
        .limit(perPage)
        .lean();

      res.render("admin/sub-admins", {
        verifiedAdmin: true,
        admins,
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

  addSubAdmin: (req, res) => {
    try {
      res.render("admin/add-admin", {
        verifiedAdmin: true,
        message: req.flash(),
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  createSubAdmin: async (req, res) => {
    try {
      req.body.Password = bcrypt.hashSync(req.body.Password, 10);
      req.body.Createdon = moment(new Date()).format("lll");
      const newAdmin = await Admin.create(req.body);
      res.redirect("/admin/sub-admins");
    } catch (error) {
      if (error.code === 11000) {
        req.flash("error", "An admin already existing with this credentials");
        res.redirect("/admin/add-sub-admin");
      }
    }
  },

  editAdminStatus: async (req, res) => {
    try {
      const id = req.params.id;
      const admin = await Admin.findById(id);
      if (admin.Status === "Active") {
        await Admin.findByIdAndUpdate(id, {
          Status: "Blocked",
        });
        res.redirect("/admin/sub-admins");
      } else {
        await Admin.findByIdAndUpdate(id, {
          Status: "Active",
        });
        res.redirect("/admin/sub-admins");
      }
    } catch (error) {
      console.log(error);
    }
  },

  removeAdmin: async (req, res) => {
    try {
      const id = req.params.id;
      const admin = await Admin.findByIdAndDelete(id);
      res.redirect("/admin/sub-admins");
    } catch (error) {
      console.log(error);
    }
  },

  generateSalesReport: async (req, res) => {
    try {
      const lastMonthFirstDate = moment().subtract(1, 'month').startOf('month');
      const lastMonthLastDate = moment().subtract(1, 'month').endOf('month');

      const startDate = lastMonthFirstDate.format('MMM D, YYYY h:mm A');
      const endDate = lastMonthLastDate.format('MMM D, YYYY h:mm A');

      const orders = await Order.find({
        Date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).lean();

      const totalSales = 1000;
      adminHelper.generateSalesReportPdf(orders, startDate, endDate, totalSales)
      .then((generatedPdfFilename) => {
        console.log('its that',generatedPdfFilename);
        res.redirect(`/admin/download-sales-report/${generatedPdfFilename}`);
      }).catch(() => {
        console.log('happened an error in generating pdf');
      })
      
    } catch (error) {
      console.error(`An error happened: ${error}`);
      res.status(500).send('Error generating sales report');
    }
  },


  downloadSalesReport: async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log("it's filename",filename);
      res.download(filename, 'sales-report.pdf', (err) => {
        if (err) {
          console.error('File not found');
          res.status(404).send('File not found');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error downloading sales report');
    }
  },
};
