// Import Mongoose
const mongoose = require('mongoose');

// Define the user schema using Mongoose
const referralSchema = new mongoose.Schema({
  referredBy: {
    type: String,
    required: true
  },
  referralCode: { type: String, unique: true },
  level: {type: Number , min: 1, max: 10, default: 1},
  active: {type: Boolean, default: false},
  levelOneReferrals :  {type: Number , default: 0},
});

// Create a new model for the referral schema
const Referral = mongoose.model('Referral', referralSchema);

// Export the referral model
module.exports = Referral;
