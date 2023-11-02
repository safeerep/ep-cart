const jwt = require('jsonwebtoken')
const Cart = require('../models/cartSchema')
require('dotenv').config()

module.exports = {
    userTokenAuth: (req, res, next) => {
        const token = req.cookies.userJwt
        if (token) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                if (err) {
                    res.redirect("/signup")
                }
                req.session.user = user;
                const userId = req.session.user?.user;
                if (userId) {
                    const userCart = await Cart.findOne({UserId: userId})
                    res.locals.numberOfItems = userCart?.Products?.length
                }
                next()
            })
        }
        else {
            res.redirect("/signup")
        }
    },
    
    userExist: (req, res, next) => {
        const token = req.cookies.userJwt;
        if (token) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    next();
                }
                else {
                    res.redirect('/home')
                }
            })
        }
        else {
            next();
        }
    }

}






