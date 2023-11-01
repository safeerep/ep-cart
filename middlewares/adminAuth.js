const jwt = require('jsonwebtoken')
const Admin = require('../models/adminSchema')
require('dotenv').config()

module.exports = {
    adminTokenAuth: (req, res, next) => {
        const token = req.cookies.adminJwt
        if (token) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
                if (err) {
                    res.redirect("/admin/signin")
                } else {
                    req.session.admin = admin;
                    // console.log(req.session.admin.admin);
                    next()
                }
            })
        }
        else {
            res.redirect("/admin/signin")
        }
    },
    
    adminExist: (req, res, next) => {
        const token = req.cookies.adminJwt;
        if (token) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
                if (err) {
                    next();
                }
                else {
                    res.redirect('/admin/dashboard')
                }
            })
        }
        else {
            next();
        }
    },

    mainAdminAuth: async (req, res, next) => {
        const admin = await Admin.find({_id: req.session.admin.admin, AccessLevel: 'Main'})
        if (admin) {
            console.log("yes it's main admin");
            next()
        } else {
            res.redirect('/admin/dashboard')
            console.log('he is not authorized to take an action on it');
        }
    }
}

