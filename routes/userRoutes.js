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
const cartInfo = require('../middlewares/userCartCount')
const couponController = require('../controllers/couponController')

// landingpage
router.get('/', auth.userExist, userController.landingPage)
router.get('/home', auth.userTokenAuth, cartInfo.cartCount, userController.homeRender)
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
router.post('/login', cartInfo.cartCount, userController.home)

// profile
router.get('/profile', auth.userTokenAuth, cartInfo.cartCount, userController.profile)
router.post('/profile', auth.userTokenAuth, cartInfo.cartCount, userController.profile)
router.post('/edit-profile', auth.userTokenAuth, cartInfo.cartCount, userController.editProfile)
// addresses
router.get('/show-addresses', auth.userTokenAuth, cartInfo.cartCount, userController.savedAddresses)
// add-address
router.get('/add-address', auth.userTokenAuth, cartInfo.cartCount, userController.address)
router.post('/add-address', auth.userTokenAuth, cartInfo.cartCount, userController.addAddress)
// edit-address
router.get('/edit-address/:id', auth.userTokenAuth, cartInfo.cartCount, userController.editAddressPage)
router.post('/edit-address/:id', auth.userTokenAuth, cartInfo.cartCount, userController.editAddress)
// remove-address
router.get('/remove-address/:id', auth.userTokenAuth, cartInfo.cartCount, userController.removeAddress)
// change-password
router.get('/profile/change-password', auth.userTokenAuth, cartInfo.cartCount, userController.toUpdatePassword)
router.post('/profile/change-password', auth.userTokenAuth, cartInfo.cartCount, userController.updatePassword)
router.get('/profile/forgot-password', auth.userTokenAuth, cartInfo.cartCount, userController.forgotPassword)
router.post('/profile/forgot-password', auth.userTokenAuth, cartInfo.cartCount, userController.sendOTP)
router.post('/profile/verify-otp', auth.userTokenAuth, cartInfo.cartCount, userController.verifyOTP)
router.get('/profile/password-change', auth.userTokenAuth, cartInfo.cartCount, userController.changePassword)
router.post('/profile/password-change', auth.userTokenAuth, cartInfo.cartCount, userController.verifyPassword)

// forgot password
router.get('/forgot-password', userController.forgotPassword)
router.post('/forgot-password', userController.sendOTP)
router.post('/verify-otp', userController.verifyOTP)
router.get('/change-password', userController.changePassword)
router.post('/verify-password', userController.verifyPassword)

// shop
router.get('/shop',cartInfo.cartCount, productController.shop)
// shop categories
router.get('/shop-in',cartInfo.cartCount, productController.shopCategory)
// product detail view
router.get('/product/details-view/:id',cartInfo.cartCount, productController.productView)

// write comment
router.post('/post-comment', auth.userTokenAuth, cartInfo.cartCount, reviewController.postReview)
router.post('/rate-product', auth.userTokenAuth, cartInfo.cartCount, reviewController.rateProduct)

// cart
router.get('/cart', auth.userTokenAuth, cartInfo.cartCount, cartController.cart)
router.post('/cart/:id', auth.userTokenAuth, cartInfo.cartCount, cartController.addToCart)
router.post('/check-before-delete-cart', auth.userTokenAuth, cartInfo.cartCount, cartController.checkDeleteCartItem)
router.post('/delete-cart-item', auth.userTokenAuth, cartInfo.cartCount, cartController.deleteCartItem)
router.post('/update-quantity', auth.userTokenAuth, cartInfo.cartCount, cartController.updateQuantity)

// check products availability
router.post('/check-products-availability', auth.userTokenAuth, cartInfo.cartCount, productController.availabilityCheck)


// checkout
router.get('/checkout', auth.userTokenAuth, cartInfo.cartCount, orderController.checkOutPage)
// users address
router.get('/add-address/for-shop', auth.userTokenAuth, cartInfo.cartCount, userController.address)
router.post('/add-address/for-shop', auth.userTokenAuth, cartInfo.cartCount, userController.addAddress)
router.post('/checkout', auth.userTokenAuth, cartInfo.cartCount, orderController.placeOrder)

// verify payment
router.post('/verify-payment', auth.userTokenAuth, cartInfo.cartCount, paymentController.verifyPayment)
// payment done / order placed
router.get('/order-placed', auth.userTokenAuth, cartInfo.cartCount, orderController.orderSuccessful)
// my - orders
router.get('/orders', auth.userTokenAuth, cartInfo.cartCount, orderController.orders)
// track-order
router.get('/track-order/:id', auth.userTokenAuth, cartInfo.cartCount, orderController.trackOrder)
// cancel-order
router.post('/cancel-order/:id', auth.userTokenAuth, cartInfo.cartCount, orderController.cancelOrder)
// return-order
router.post('/return-order/:id', auth.userTokenAuth, cartInfo.cartCount, orderController.returnOrder)
// download invoice
router.post('/create-invoice', auth.userTokenAuth, cartInfo.cartCount, orderController.createInvoice)
router.get('/download-invoice/:orderId', auth.userTokenAuth, cartInfo.cartCount, orderController.downloadInvoice)

// wishlist
router.get('/wishlist', auth.userTokenAuth, cartInfo.cartCount, wishlistController.wishlist)
router.post('/add-to-wishlist', auth.userTokenAuth, cartInfo.cartCount, wishlistController.addToWishlist)
router.get('/wishlist/delete-item/:id', auth.userTokenAuth, cartInfo.cartCount, wishlistController.removeItem)
router.get('/wishlist/available-size/:id', auth.userTokenAuth, cartInfo.cartCount, wishlistController.sizesToAdd)

// coupon
router.get('/coupons-and-offers', auth.userTokenAuth, cartInfo.cartCount, couponController.availableOffers)
router.post('/apply-coupon', auth.userTokenAuth, cartInfo.cartCount, couponController.applyCoupon)
router.post('/apply-another-coupon', auth.userTokenAuth, cartInfo.cartCount, couponController.applyAnotherCoupon)


// check coupon validity
router.post('/to-check-coupon-validity', auth.userTokenAuth, cartInfo.cartCount, couponController.checkCouponValidity)
router.post('/delete-coupon-from-cart', auth.userTokenAuth, cartInfo.cartCount, couponController.deleteCouponFromCart)








module.exports = router;




