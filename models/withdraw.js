// Import Mongoose
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

// Define the user schema using Mongoose
const withdrawSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  amount_withdraw: {
    type: Number,
    required: true,
  },
  amount_withdraw_status: {
    type: String,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Create a pre-save hook to generate a unique referral code for each new user
withdrawSchema.pre("save", function (next) {
  const withdraw = this;
  withdraw.transaction_id = 'TXN' + uuidv4();
  next();
});

// Create a new model for the user schema
const Withdraw = mongoose.model("withdraw", withdrawSchema);

// Export the user model
module.exports = Withdraw;
