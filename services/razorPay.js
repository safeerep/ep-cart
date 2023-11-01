const Razorpay = require("razorpay");
require('dotenv').config()


module.exports = {
    
    createRazorpayOrder : (order) => {
      return new Promise ((resolve, reject) => {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });
        
          const {_id, PayableAmount} = order;
          var options = {
            amount: PayableAmount * 100,  
            currency: "INR",
            receipt: _id
          };
    
          instance.orders.create(options, (err, order) => {
            if (err) {
                console.log(err);
                reject(err)
            }
            else {
                resolve(order)
            }
          });
      })
    }
}




