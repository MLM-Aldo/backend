// Import Mongoose
const mongoose = require("mongoose");

// Define the user schema using Mongoose
const userSchema = new mongoose.Schema({
  loginId:{
    type: Number,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  transactionPassword: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  referredBy: {
    type: String,
    required: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
    get: (v) => Number(v),
    set: (v) => Number(v),
  },
  membership: {
    type: Number,
    default: 0,
  },
  referralCode: { type: String, unique: true },
  active: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  level: {type: Number , min: 1, max: 10, default: 1},
  level1 :  {type: Number , default: 0},
  level2 :  {type: Number , default: 0},
  level3 :  {type: Number , default: 0},
  level4 :  {type: Number , default: 0},
  level5 :  {type: Number , default: 0},
  level6 :  {type: Number , default: 0},
  level7 :  {type: Number , default: 0},
  level8 :  {type: Number , default: 0},
  referralBonus: {type: Number, default: 0},
});

// Create a pre-save hook to generate a unique referral code for each new user
userSchema.pre("save", function (next) {
  if (!this.isNew) return next();
  const user = this;
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let referralCode = "";
  for (let i = 0; i < 8; i++) {
    referralCode += chars[Math.floor(Math.random() * chars.length)];
  }
  user.referralCode = referralCode;
  next();
});

// Create a new model for the user schema
const User = mongoose.model("User", userSchema);

// Export the user model
module.exports = User;
