const Cart = require("../models/cartSchema");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const util = require("util");
const writeFileAsync = util.promisify(fs.writeFile);
const easyinvoice = require("easyinvoice");

module.exports = {
  getTotal: async (userId) => {
    const cartDetails = await Cart.aggregate([
      {
        $match: {
          UserId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: "$Products",
      },
      {
        $lookup: {
          from: "products",
          localField: "Products.ProductId",
          foreignField: "_id",
          as: "ProductDetails",
        },
      },
      {
        $unwind: "$ProductDetails",
      },
      {
        $project: {
          _id: 0,
          UserId: 1,
          ProductId: "$Products.ProductId",
          Quantity: "$Products.Quantity",
          Size: "$Products.Size",
          ProductName: "$ProductDetails.ProductName",
          BasePrice: "$ProductDetails.BasePrice",
          SellingPrice: "$ProductDetails.SellingPrice",
          Description: "$ProductDetails.Description",
          BrandName: "$ProductDetails.BrandName",
          Images: "$ProductDetails.images",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $multiply: ["$BasePrice", "$Quantity"],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
        },
      },
    ]);

    const totalAmountForAllProducts = cartDetails[0]
      ? cartDetails[0].totalAmount
      : 0;
    // console.log(totalAmountForAllProducts);
    return totalAmountForAllProducts;
  },

  getPrice: async (userId) => {
    const cartDetails = await Cart.aggregate([
      {
        $match: {
          UserId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: "$Products",
      },
      {
        $lookup: {
          from: "products",
          localField: "Products.ProductId",
          foreignField: "_id",
          as: "ProductDetails",
        },
      },
      {
        $unwind: "$ProductDetails",
      },
      {
        $project: {
          _id: 0,
          UserId: 1,
          ProductId: "$Products.ProductId",
          Quantity: "$Products.Quantity",
          Size: "$Products.Size",
          ProductName: "$ProductDetails.ProductName",
          BasePrice: "$ProductDetails.BasePrice",
          SellingPrice: "$ProductDetails.SellingPrice",
          Description: "$ProductDetails.Description",
          BrandName: "$ProductDetails.BrandName",
          Images: "$ProductDetails.images",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $multiply: ["$SellingPrice", "$Quantity"],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
        },
      },
    ]);
    let totalPrice = cartDetails[0] ? cartDetails[0].totalAmount : 0;
    const cartData = await Cart.findOne({
      UserId: new mongoose.Types.ObjectId(userId),
    });
    if (cartData?.Discount) {
      totalPrice = totalPrice - cartData.Discount;
    }
    return totalPrice;
  },

  createPdf: async (orderDetails) => {
    // console.log(orderDetails.ShippingAddress.HouseName,orderDetails.ShippingAddress.District,);
    const data = {
      customize: {
        // "template": fs.readFileSync('invoice.hbs', 'base64') // Must be base64 encoded HTML
      },
      images: {
        // The logo on top of your invoice
        "logo": "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
        // The invoice background
        "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      sender: {
        "company": "EP-CART",
        "address": "EP-CART PVT.LTD, TIRUR",
        "city": "MALAPPURAM",
        "state": "KERALA"
      },
      client: {
        "address": orderDetails.ShippingAddress.HouseName,
        "zip": orderDetails.ShippingAddress.District,
        "city": orderDetails.ShippingAddress.State,
        "country": orderDetails.ShippingAddress.Pincode
      },
      information: {
        "number": orderDetails._id,
        "date": orderDetails.Date,
        "due-date": orderDetails.Date
      },
      products: orderDetails.Products.map((product) => ({
        "description": product.ProductId.ProductName,
        "quantity": product.Quantity,
        "tax-rate": 0,
        "price": product.ProductId.SellingPrice
      })),
      "bottom-notice": "Kindly pay your invoice within 15 days.",
      settings: {
        "currency": "INR"
      }
    };
    

    return new Promise(async (resolve, reject) => {
      try {
        const result = await easyinvoice.createInvoice(data);
        const filePath = path.join(__dirname, '..', 'public', 'pdf', `${orderDetails._id}.pdf`);
        await writeFileAsync(filePath, result.pdf, 'base64');
        console.log("Promise try");
        resolve(filePath);
      } catch (error) {
        console.log("Promise catch");
        reject(error); 
      }
    });
  },
};
