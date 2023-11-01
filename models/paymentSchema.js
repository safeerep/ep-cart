const mongoose = require('mongoose');
const { Schema, ObjectId } = mongoose;

const PaymentsSchema = new mongoose.Schema({
  TransactionId: { 
    type: Schema.Types.ObjectId,
    required: true, 
    unique: true 
},
  PaymentMethod: { 
    type: String, 
    required: true 
},
  Date: { 
    type: String, 
    required: true 
},
  UserId: { 
    type: Schema.Types.ObjectId,
    required: true 
},
  Amount: { 
    type: Number, 
    required: true 
},
});

const Payments = mongoose.model('Payments', PaymentsSchema);

module.exports = Payments;

