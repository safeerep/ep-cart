const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Banners = require("../models/bannerSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const nodeMailer = require("../services/nodeMailer");
const RefferalOffer = require("../models/refferalOfferSchema");
require("dotenv").config();

module.exports = {
  landingPage: async (req, res) => {
    try {
      const productDetails = await Product.find({ Display: "Active" }).lean();
      const categories = await Category.find().lean();
      const banners = await Banners.find({ Status: true })
        .sort({ _id: -1 })
        .limit(3)
        .lean();
      res.render("user/landing", {
        notVerifiedUser: true,
        productDetails,
        categories,
        banners,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  homeRender: async (req, res) => {
    try {
      const Search = req.query.Search || "";
      const productDetails = await Product.find({
        Display: "Active",
        ProductName: {
          $regex: Search,
          $options: "i",
        },
      }).lean();
      const categories = await Category.find({}).lean();
      const banners = await Banners.find({ Status: true })
        .sort({ _id: -1 })
        .limit(3)
        .lean();
      res.render("user/home", {
        user: true,
        productDetails,
        categories,
        banners,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  searchResult: async (req, res) => {
    try {
      let search = req.query.Search || "";
      const productDetails = await Product.aggregate([
        {
          $unwind: "$Tags",
        },
        {
          $match: {
            Tags: search,
          },
        },
      ]);
      res.render("user/shop", { user: true });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  // user
  signUP: (req, res) => {
    try {
      if (req.url === "/signup") {
        res.render("user/signup", {
          personNotVerified: true,
          message: req.flash(),
        });
      } else {
        const refferalId = req.params.id;
        res.render("user/signup", {
          personNotVerified: true,
          message: req.flash(),
          refferalId,
        });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  refferalRegister: async (req, res) => {
    try {
      const existingUser = await User.findOne({ Email: req.body.Email });
      if (existingUser) {
        req.flash("error", "user already exists");
        res.redirect("/signup");
      } else {
        if (req.body.Password.length >= 4) {
          if (req.body.Password === req.body.Confirmation) {
            const refferalOffer = await RefferalOffer.findOne({ Active: true });
            req.body.Password = bcrypt.hashSync(req.body.Password, 10);
            req.body.Createdon = moment(new Date()).format("lll");
            req.body.WalletAmount = refferalOffer?.OfferforReferred || 0;
            req.body.referrerPerson = req.params.id;
            console.log();
            req.session.user = req.body;
            req.flash("success", "OTP Sent Successfully");
            res.redirect("/refferal-user/email-verification");
          } else {
            req.flash("error", "password is not matching");
            res.redirect("/signup");
          }
        } else {
          req.flash("error", "password lenght should be atleast 4");
          res.redirect("/signup");
        }
      }
    } catch (error) {
      res.redirect("/signup");
    }
  },

  forgotPassword: async (req, res) => {
    try {
      if (req.url === "/profile/forgot-password") {
        const userId = req.session.user.user;
        const userData = await User.findOne({ _id: userId }).lean();
        res.render("user/profile-forgot-password", {
          personNotVerified: true,
          message: req.flash(),
          Email: req.session.userEmail,
          userData,
        });
      } else {
        res.render("user/forgot-password", {
          personNotVerified: true,
          message: req.flash(),
          Email: req.session.userEmail,
        });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  sendOTP: async (req, res) => {
    try {
      const Email = req.body.Email;
      const userEmailFound = await User.findOne({ Email: req.body.Email });
      if (userEmailFound) {
        const digits = "0123456789";
        let OTP = "";
        for (let i = 0; i < 4; i++) {
          OTP += digits[Math.floor(Math.random() * 10)];
        }
        const Email = req.body.Email;
        const otpsent = await nodeMailer.sendOtp(OTP, Email);
        req.flash("success", "OTP sent successfully");
        req.session.userEmail = Email;
        req.session.OTP = OTP;
        if (req.url === "/profile/forgot-password") {
          res.redirect("/profile/forgot-password");
        } else {
          res.redirect("/forgot-password");
        }
      } else {
        req.flash("error", "Invalid email address");
        res.redirect("/forgot-password");
      }
    } catch (error) {
      console.log("the error is", error);
      req.flash("error", "Invalid email address");
      res.redirect("/forgot-password");
    }
  },

  verifyOTP: (req, res) => {
    try {
      if (req.session.userEmail === null) {
        req.flash("error", "Enter your email first");
        res.redirect("/forgot-password");
      } else {
        if (req.body.OTP === req.session.OTP) {
          req.session.otpVerifiedUser = req.body;
          if (req.url === "/profile/verify-otp") {
            res.redirect("/profile/password-change");
          } else {
            res.redirect("/change-password");
          }
        } else {
          req.flash("error", "OTP is not matching");
          if (req.url === "/profile/verify-otp") {
            res.redirect("/profile/forgot-password");
          } else {
            res.redirect("/forgot-password");
          }
        }
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  changePassword: (req, res) => {
    try {
      if (req.session.otpVerifiedUser) {
        if (req.url === "/profile/password-change") {
          res.render("user/profile-change-password", {
            user: true,
            message: req.flash(),
          });
        } else {
          res.render("user/password-change", {
            personNotVerified: true,
            message: req.flash(),
          });
        }
      } else {
        console.log(
          `trying to get change password page without OTP verification`
        );
        res.redirect("/forgot-password");
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  verifyPassword: async (req, res) => {
    try {
      if (req.body.Password === req.body.ConfirmPassword) {
        req.body.Password = bcrypt.hashSync(req.body.Password, 10);
        const user = await User.findOneAndUpdate(
          { Email: req.session.userEmail },
          {
            Password: req.body.Password,
          }
        );
        if (user) {
          const accessToken = jwt.sign(
            { user: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30d" }
          );
          res.cookie("userJwt", accessToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          req.session.user = user;
          if (req.url === "/profile/password-change") {
            res.redirect("/profile");
          } else {
            res.redirect("/home");
          }
        } else {
          res.redirect("/landing");
        }
      } else {
        req.flash("error", "password is not matching");
        res.redirect("/change-password");
      }
    } catch (error) {
      req.flash("error", "An error happened");
      res.redirect("/change-password");
    }
  },

  logout: (req, res) => {
    try {
      res.clearCookie("userJwt");
      res.redirect("/");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  register: async (req, res) => {
    try {
      const existingUser = await User.findOne({ Email: req.body.Email });
      if (existingUser) {
        req.flash("error", "user already exists");
        res.redirect("/signup");
      } else {
        if (req.body.Password.length >= 4) {
          if (req.body.Password === req.body.Confirmation) {
            req.body.Password = bcrypt.hashSync(req.body.Password, 10);
            req.body.Createdon = moment(new Date()).format("lll");
            req.body.WalletAmount = 0;
            req.session.user = req.body;
            req.flash("success", "OTP Sent Successfully");
            res.redirect("/email-verification");
          } else {
            req.flash("error", "password is not matching");
            res.redirect("/signup");
          }
        } else {
          req.flash("error", "password lenght should be atleast 4");
          res.redirect("/signup");
        }
      }
    } catch (error) {
      res.redirect("/signup");
    }
  },

  verifyEmailPage: async (req, res) => {
    try {
      const digits = "0123456789";
      let OTP = "";
      for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      const Email = req.session.user.Email;
      nodeMailer.sendOtp(OTP, Email);
      req.session.OTP = OTP;
      if (req.url === "/refferal-user/email-verification") {
        res.render("user/verify-email", {
          personNotVerified: true,
          refferalUser: true,
          Email,
          message: req.flash(),
        });
      } else {
        res.render("user/verify-email", {
          personNotVerified: true,
          Email,
          message: req.flash(),
        });
      }
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },

  verifyEmail: async (req, res) => {
    try {
      if (req.session.OTP === req.body.OTP) {
        const userData = await User.create(req.session.user);
        if (userData) {
          const accessToken = jwt.sign(
            { user: userData._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30d" }
          );
          res.cookie("userJwt", accessToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          req.session.user = userData;
          res.redirect("/home");
        }
      } else {
        req.flash("error", "OTP invalid");
        res.redirect("/email-verification");
      }
    } catch (error) {}
  },

  verifyEmailForRefferalUser: async (req, res) => {
    try {
      if (req.session.OTP === req.body.OTP) {
        console.log("ok matched");
        const userData = await User.create(req.session.user);
        if (userData) {
          const accessToken = jwt.sign(
            { user: userData._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30d" }
          );
          res.cookie("userJwt", accessToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
          // giving referral offer to refferer person
          const refferalOffer = await RefferalOffer.findOne({ Active: true });
          const referrerPerson = req.session?.user?.referrerPerson;
          const OfferforReferrer = refferalOffer?.OfferforReferrer || 0;
          const updatingWalletAmount = await User.findByIdAndUpdate(
            {
              _id: referrerPerson,
            },
            {
              $inc: {
                WalletAmount: OfferforReferrer,
              },
            }
          );
          req.session.user = userData;
          res.redirect("/home");
        }
      } else {
        req.flash("error", "OTP invalid");
        res.redirect("/refferal-user/email-verification");
      }
    } catch (error) {}
  },

  loginPage: async (req, res) => {
    try {
      res.render("user/login", {
        personNotVerified: true,
        message: req.flash(),
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  profile: async (req, res) => {
    try {
      const userData = await User.findById(req.session.user.user).lean();
      const refferalOffer = await RefferalOffer.findOne({
        Active: true,
      }).lean();
      res.render("user/profile", {
        user: true,
        userData,
        message: req.flash(),
        refferalOffer,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  editProfile: async (req, res) => {
    try {
      const id = req.session.user.user;
      const updatedprofile = await User.findByIdAndUpdate(id, {
        Name: req.body.Name,
        Email: req.body.Email,
        Phone: req.body.Phone,
      });
      res.redirect("/profile");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  savedAddresses: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const userData = await User.findOne({ _id: userId }).lean();
      const userAddresses = userData.Address;
      res.render("user/saved-addresses", { user: true, userData });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  address: async (req, res) => {
    try {
      const userData = await User.findById(req.session.user.user).lean();
      if (req.url === "/add-address/for-shop") {
        res.render("user/address-for-shop", { user: true, userData });
      } else {
        res.render("user/add-address", { user: true, userData });
      }
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  addAddress: async (req, res) => {
    try {
      const id = req.session.user.user;
      const userData = await User.findByIdAndUpdate(id, {
        $push: {
          Address: {
            HouseName: req.body.HouseName,
            District: req.body.District,
            State: req.body.State,
            Pincode: req.body.Pincode,
          },
        },
      });
      if (req.url === "/add-address/for-shop") {
        res.redirect("/checkout");
      } else {
        res.redirect("/profile");
      }
    } catch (error) {
      console.log("happened one error", error);
      res.redirect("/profile");
    }
  },

  editAddressPage: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const addressId = req.params.id;
      const userData = await User.findById(userId).lean();
      const address = await User.findOne(
        {
          _id: userId,
          "Address._id": addressId,
        },
        {
          "Address.$": 1,
        }
      ).lean();
      res.render("user/edit-address", { user: true, userData, address });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  editAddress: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const addressId = req.params.id;
      const userAddress = await User.findOneAndUpdate(
        {
          _id: userId,
          "Address._id": addressId,
        },
        {
          $set: {
            "Address.$": req.body,
          },
        }
      );
      res.redirect("/profile");
    } catch (error) {
      console.log("happened one error", error);
    }
  },

  removeAddress: async (req, res) => {
    try {
      const addressId = req.params.id;
      const userId = req.session.user.user;
      const userAddress = await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $pull: {
            Address: {
              _id: addressId,
            },
          },
        }
      );
      res.redirect("/profile");
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  toUpdatePassword: async (req, res) => {
    try {
      const userId = req.session.user.user;
      const userData = await User.findOne({ _id: userId }).lean();
      res.render("user/change-password", {
        user: true,
        message: req.flash(),
        userData,
      });
    } catch (error) {
      console.log(error, "error happened");
    }
  },

  updatePassword: async (req, res) => {
    try {
      const id = req.session.user.user;
      const userData = await User.findById(id);
      const passwordCheck = bcrypt.compareSync(
        req.body.Password,
        userData.Password
      );
      if (passwordCheck) {
        req.body.NewPassword = bcrypt.hashSync(req.body.Password, 10);
        const updatePassword = await User.findByIdAndUpdate(id, {
          Password: req.body.NewPassword,
        });
        req.flash("success", "Successfully updated your password");
        res.redirect("/profile");
      } else {
        req.flash("error", "password is not correct");
        res.redirect("/profile/change-password");
      }
    } catch (error) {
      console.log("An error occured", error);
      res.redirect("/profile/change-password");
    }
  },

  // product
  home: async (req, res) => {
    try {
      const user = await User.findOne({ Email: req.body.Email });
      if (user) {
        const passwordCheck = await bcrypt.compare(
          req.body.Password,
          user.Password
        );
        if (user.Status === "Active") {
          if (passwordCheck) {
            const accessToken = jwt.sign(
              { user: user._id },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "30d" }
            );
            res.cookie("userJwt", accessToken, {
              maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            req.session.user = user;
            res.redirect("/home");
          } else {
            throw "username or password is incorrect";
          }
        } else {
          throw "you are not authorized to sign in";
        }
      } else {
        throw "Username or password is incorrect";
      }
    } catch (error) {
      req.flash("error", "username or password is incorrect");
      res.redirect("/login");
    }
  },
};
