const express = require("express");
const router = express.Router();
const auth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload");
const adminController = require("../controllers/adminController");
const bannerController = require('../controllers/bannerController')
const categoryController = require("../controllers/categoryController");
const couponController = require("../controllers/couponController")
const offerController = require("../controllers/offerController")
const orderController = require('../controllers/orderController')
const productController = require('../controllers/productController')
const reviewController = require("../controllers/reviewController");

// signin
router.get("/signin", auth.adminExist, adminController.signin);
router.post("/signin", auth.adminExist, adminController.home);

// forgot password
router.get("/forgot-password", auth.adminExist, adminController.forgotPassword);
router.post("/send-otp", adminController.sendOTP);
router.post("/verify-otp", adminController.verifyOTP);
router.get("/change-password", adminController.changePassword);
router.post("/verify-password", adminController.verifyPassword);

// logout
router.get("/logout", auth.adminTokenAuth, adminController.logout);

// adding new admin
router.get("/add-admin", auth.adminTokenAuth, adminController.addAdmin);
router.post("/add-admin", auth.adminTokenAuth, adminController.createAdmin);

// admin dashboard
router.get("/dashboard", auth.adminTokenAuth, adminController.dashboard);

// dashboard get data
router.post('/dashboard/get-data', auth.adminTokenAuth, adminController.getDashboardData)



// productpage
router.get("/products", auth.adminTokenAuth, productController.productPage);
// add product
router.get("/add-product", auth.adminTokenAuth, productController.addProductPage);
router.post(
  "/add-product",
  auth.adminTokenAuth,
  upload.fields([{name: "image1"}, {name: "image2"}, {name: "image3"}]),
  productController.addProduct
);
// Actions on product
// ban
router.get("/ban-product/:id", auth.adminTokenAuth, productController.banProduct);
// edit
router.get(
  "/edit-product-details/:id",
  auth.adminTokenAuth,
  productController.editProductDetails
);
router.post(
  "/edit-product-details/:id",
  auth.adminTokenAuth,
  upload.fields([{name: "image1"}, {name: "image2"}, {name: "image3"}]),
  productController.updateProductDetails
);
// view product
router.get('/product-reviews/:id', auth.adminTokenAuth, productController.viewReviews)



// categories
router.get('/product-categories', auth.adminTokenAuth, categoryController.categories)
// add-categories
router.get('/add-category', auth.adminTokenAuth, categoryController.addCategoryPage)
router.post('/add-category', auth.adminTokenAuth, upload.single("Image"), categoryController.addCategory)
// edit-categories
router.get('/edit-category/:id', auth.adminTokenAuth, categoryController.editCategory)
router.post('/edit-category/:id', auth.adminTokenAuth, upload.single("Image"),categoryController.updateCategory)



// users list showing
router.get("/users-list", auth.adminTokenAuth, adminController.users);
// Action on customer
router.get("/block-user/:id", auth.adminTokenAuth, adminController.blockUser);
// filters
router.get("/active-customers", auth.adminTokenAuth, adminController.filters);
router.get("/blocked-customers", auth.adminTokenAuth, adminController.filters);

// orders
router.get('/orders', auth.adminTokenAuth, orderController.ordersList)
// filter
router.get('/pending-orders', auth.adminTokenAuth, orderController.pendingOrdersList)
router.get('/cancelled-orders', auth.adminTokenAuth, orderController.cancelledOrdersList)
router.get('/return-related', auth.adminTokenAuth, orderController.returnRelated)
router.get('/return-requests', auth.adminTokenAuth, orderController.returnRequests)
// update-orders
router.get('/update-order/:id', auth.adminTokenAuth, orderController.updateOrder)
router.get('/cancel-order/:id', auth.adminTokenAuth, orderController.rejectOrderByAdmin)
router.get('/view-order/:id', auth.adminTokenAuth, orderController.viewOrderForAdmin)


// sub-admins
router.get(
  "/sub-admins",
  auth.adminTokenAuth,
  auth.mainAdminAuth,
  adminController.subAdmins
);
// add new sub-admin
router.get(
  "/add-sub-admin",
  auth.adminTokenAuth,
  auth.mainAdminAuth,
  adminController.addSubAdmin
);
router.post(
  "/add-sub-admin",
  auth.adminTokenAuth,
  adminController.createSubAdmin
);
// Actions on sub-admin
router.get(
  "/block-admin/:id",
  auth.adminTokenAuth,
  auth.mainAdminAuth,
  adminController.editAdminStatus
);
router.get(
  "/remove-admin/:id",
  auth.adminTokenAuth,
  auth.mainAdminAuth,
  adminController.removeAdmin
);


// banner
router.get('/banners', auth.adminTokenAuth, bannerController.banners)
router.get('/add-banner', auth.adminTokenAuth, bannerController.addBannerPage)
router.post('/add-banner', auth.adminTokenAuth, upload.single("Image"), bannerController.addBanner)
router.get('/edit-banner-status', auth.adminTokenAuth, bannerController.editStatus)


// review
router.get('/reviews', auth.adminTokenAuth, reviewController.reviews)
router.get('/reviews/oldest', auth.adminTokenAuth, reviewController.reviews)
router.get('/delete-review/:id', auth.adminTokenAuth, reviewController.deleteReview)


// coupons
router.get('/coupons', auth.adminTokenAuth, couponController.coupons)
router.get('/add-coupon', auth.adminTokenAuth, couponController.addCouponPage)
router.post('/add-coupon', auth.adminTokenAuth, couponController.addCoupon)
// actions
router.get('/disable-coupon/:id', auth.adminTokenAuth, couponController.disableCoupon)
router.get('/enable-coupon/:id', auth.adminTokenAuth, couponController.enableCoupon)
router.get('/edit-coupon/:id', auth.adminTokenAuth, couponController.editCouponPage)
router.post('/edit-coupon/:id', auth.adminTokenAuth, couponController.editCoupon)


// offers
router.get('/offers', auth.adminTokenAuth, offerController.offers)
router.get('/add-offer', auth.adminTokenAuth, offerController.addOfferPage)
router.post('/add-offer', auth.adminTokenAuth, offerController.addOffer)
// actions on offers 
router.get('/disable-offer/:id', auth.adminTokenAuth, offerController.disableOffer)
router.get('/enable-offer/:id', auth.adminTokenAuth, offerController.enableOffer)
router.get('/edit-offer/:id', auth.adminTokenAuth, offerController.editOfferPage)
router.post('/edit-offer/:id', auth.adminTokenAuth, offerController.editOffer)

// refferal-offer
router.get('/add-refferal-offer', auth.adminTokenAuth, offerController.addRefferalOfferPage)
router.post('/add-refferal-offer', auth.adminTokenAuth, offerController.addRefferalOffer)
// actions on refferal offers
router.get('/enable-refferal-offer/:id', auth.adminTokenAuth, offerController.enableRefferalOffer)
router.get('/disable-refferal-offer/:id', auth.adminTokenAuth, offerController.disableRefferalOffer)
router.get('/edit-refferal-offer/:id', auth.adminTokenAuth, offerController.editRefferalOfferPage)
router.post('/edit-refferal-offer/:id', auth.adminTokenAuth, offerController.editRefferalOffer)




module.exports = router;
