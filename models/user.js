// Import Mongoose
const mongoose = require('mongoose');

// Define the user schema using Mongoose
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  referralCode: { type: String, unique: true }
});

// referredBy: String,
// 

// Create a pre-save hook to generate a unique referral code for each new user
userSchema.pre('save', function (next) {
  const user = this;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let referralCode = '';
  for (let i = 0; i < 8; i++) {
    referralCode += chars[Math.floor(Math.random() * chars.length)];
  }
  user.referralCode = referralCode;
  next();
});

// Create a new model for the user schema
const User = mongoose.model('User', userSchema);

// Export the user model
module.exports = User;
