const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const wishlistController = require('../controllers/wishlistController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const reviewController = require('../controllers/reviewController')
const paymentController = require('../controllers/paymentController')
const auth = require('../middlewares/userAuth')
const couponController = require('../controllers/couponController')

// landingpage
router.get('/', auth.userExist, userController.landingPage)
router.get('/home', auth.userTokenAuth, userController.homeRender)
// /search-product
router.get('/search-product', userController.searchResult)

// logout
router.get('/logout', auth.userTokenAuth, userController.logout)
// new user

router.get('/signup', auth.userExist, userController.signUP)
router.post('/signup', userController.register)

// referral 
router.get('/signup/:id', auth.userExist, userController.signUP)
router.post('/signup/:id', userController.refferalRegister)

// email verification
router.get('/email-verification', auth.userExist, userController.verifyEmailPage)
router.post('/email-verification', auth.userExist, userController.verifyEmail)
router.get('/refferal-user/email-verification', auth.userExist, userController.verifyEmailPage)
router.post('/refferal-user/email-verification', auth.userExist, userController.verifyEmailForRefferalUser)

// existing user
router.get('/login', auth.userExist, userController.loginPage)
router.post('/login', userController.home)

// profile
router.get('/profile', auth.userTokenAuth, userController.profile)
router.post('/profile', auth.userTokenAuth, userController.profile)
router.post('/edit-profile', auth.userTokenAuth, userController.editProfile)
// addresses
router.get('/show-addresses', auth.userTokenAuth, userController.savedAddresses)
// add-address
router.get('/add-address', auth.userTokenAuth, userController.address)
router.post('/add-address', auth.userTokenAuth, userController.addAddress)
// edit-address
router.get('/edit-address/:id', auth.userTokenAuth, userController.editAddressPage)
router.post('/edit-address/:id', auth.userTokenAuth, userController.editAddress)
// remove-address
router.get('/remove-address/:id', auth.userTokenAuth, userController.removeAddress)
// change-password
router.get('/profile/change-password', auth.userTokenAuth, userController.toUpdatePassword)
router.post('/profile/change-password', auth.userTokenAuth, userController.updatePassword)
router.get('/profile/forgot-password', auth.userTokenAuth, userController.forgotPassword)
router.post('/profile/forgot-password', auth.userTokenAuth, userController.sendOTP)
router.post('/profile/verify-otp', auth.userTokenAuth, userController.verifyOTP)
router.get('/profile/password-change', auth.userTokenAuth, userController.changePassword)
router.post('/profile/password-change', auth.userTokenAuth, userController.verifyPassword)

// forgot password
router.get('/forgot-password', userController.forgotPassword)
router.post('/forgot-password', userController.sendOTP)
router.post('/verify-otp', userController.verifyOTP)
router.get('/change-password', userController.changePassword)
router.post('/verify-password', userController.verifyPassword)

// shop
router.get('/shop', productController.shop)
// shop categories
router.get('/category/:id', productController.shopCategory)
// product detail view
router.get('/product/details-view/:id', productController.productView)

// write comment
router.post('/post-comment', auth.userTokenAuth, reviewController.postReview)
router.post('/rate-product', auth.userTokenAuth, reviewController.rateProduct)

// cart
router.get('/cart', auth.userTokenAuth, cartController.cart)
router.post('/cart/:id', auth.userTokenAuth, cartController.addToCart)
router.post('/check-before-delete-cart', auth.userTokenAuth, cartController.checkDeleteCartItem)
router.post('/delete-cart-item', auth.userTokenAuth, cartController.deleteCartItem)
router.post('/update-quantity', auth.userTokenAuth, cartController.updateQuantity)

// check products availability
router.post('/check-products-availability', auth.userTokenAuth, productController.availabilityCheck)


// checkout
router.get('/checkout', auth.userTokenAuth, orderController.checkOutPage)
// users address
router.get('/add-address/for-shop', auth.userTokenAuth, userController.address)
router.post('/add-address/for-shop', auth.userTokenAuth, userController.addAddress)
router.post('/checkout', auth.userTokenAuth, orderController.placeOrder)

// verify payment
router.post('/verify-payment', auth.userTokenAuth, paymentController.verifyPayment)
// payment done / order placed
router.get('/order-placed', auth.userTokenAuth, orderController.orderSuccessful)
// my - orders
router.get('/orders', auth.userTokenAuth, orderController.orders)
// track-order
router.get('/track-order/:id', auth.userTokenAuth, orderController.trackOrder)
// cancel-order
router.post('/cancel-order/:id', auth.userTokenAuth, orderController.cancelOrder)
// return-order
router.post('/return-order/:id', auth.userTokenAuth, orderController.returnOrder)
// download invoice
router.post('/create-invoice', auth.userTokenAuth, orderController.createInvoice)
router.get('/download-invoice/:orderId', auth.userTokenAuth, orderController.downloadInvoice)

// wishlist
router.get('/wishlist', auth.userTokenAuth, wishlistController.wishlist)
router.post('/add-to-wishlist', auth.userTokenAuth, wishlistController.addToWishlist)
router.get('/wishlist/delete-item/:id', auth.userTokenAuth, wishlistController.removeItem)
router.get('/wishlist/available-size/:id', auth.userTokenAuth, wishlistController.sizesToAdd)

// coupon
router.get('/coupons-and-offers', auth.userTokenAuth, couponController.availableOffers)
router.post('/apply-coupon', auth.userTokenAuth, couponController.applyCoupon)
router.post('/apply-another-coupon', auth.userTokenAuth, couponController.applyAnotherCoupon)


// check coupon validity
router.post('/to-check-coupon-validity', auth.userTokenAuth, couponController.checkCouponValidity)
router.post('/delete-coupon-from-cart', auth.userTokenAuth, couponController.deleteCouponFromCart)









module.exports = router;




