// Import Mongoose
const mongoose = require('mongoose');

// Define the user schema using Mongoose
const referralBonusSchema = new mongoose.Schema({
  referralCode: { type: String, unique: true, required: true },
  requestedAmount: { type: Number , required: true},
  state : { type: String, required: true },
});

// Create a new model for the referral bonus schema
const ReferralBonus = mongoose.model('ReferralBonus', referralBonusSchema);

// Export the referral model
module.exports = ReferralBonus;
