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
  level1 :  {type: Number , default: 0},
  level2 :  {type: Number , default: 0},
  level3 :  {type: Number , default: 0},
  level4 :  {type: Number , default: 0},
  level5 :  {type: Number , default: 0},
  referralBonus: {type: Number, default: 0},
  totalBonus: {type: Number, default: 0},
});

// Create a new model for the referral schema
const Referral = mongoose.model('Referral', referralSchema);

// Export the referral model
module.exports = Referral;
