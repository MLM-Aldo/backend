// Import Mongoose
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

// Define the user schema using Mongoose
const fundSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  amount_requested: {
    type: Number,
    required: true,
  },
  amount_request_status: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  payment_mode:{
    type: String,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Create a pre-save hook to generate a unique referral code for each new user
fundSchema.pre("save", function (next) {
  const fund = this;
  fund.transaction_id = 'TXN' + uuidv4();
  next();
});

// Create a new model for the user schema
const Fund = mongoose.model("Fund", fundSchema);

// Export the user model
module.exports = Fund;
