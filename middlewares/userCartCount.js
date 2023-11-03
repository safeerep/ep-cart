const Cart = require("../models/cartSchema");

module.exports = {
  cartCount: async (req, res, next) => {
    const userId = req.session.user?.user;
    if (userId) {
      const userCart = await Cart.findOne({ UserId: userId });
      res.locals.numberOfItems = userCart?.Products?.length;
    }
    next();
  },
};
