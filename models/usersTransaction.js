// Import Mongoose
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

// Define the user schema using Mongoose
const usersTransactionsSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  sender_id: {
    type: String,
  },
  receiver_id: {
    type: String,
    required: true,
  },
 sent_amount: {
    type: Number,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Create a pre-save hook to generate a unique referral code for each new user
usersTransactionsSchema.pre("save", function (next) {
  const usersTransactions = this;
  usersTransactions.transaction_id = 'TXN' + uuidv4();
  next();
});

// Create a new model for the user schema
const UsersTransactions = mongoose.model("usersTransactions", usersTransactionsSchema);

// Export the user model
module.exports = UsersTransactions;
