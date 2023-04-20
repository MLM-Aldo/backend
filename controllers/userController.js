const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Fund = require("../models/fund");
const withdraw = require("../models/withdraw");
const UsersTransactions = require("../models/usersTransaction");
const { startActivationJob, registerUserReferral } = require("../services/referral");
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const { sanitize } = require('express-validator');

const multer  = require('multer');
const path = require('path');

const crypto = require('crypto');

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secretKey = process.env.SECRET_KEY || generateSecretKey();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'contents/')
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage }).single('transaction');

// use the secretKey to sign JWT tokens
// ...

exports.registerValidationRules = () => [
  body('username').trim().escape(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('transactionPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('email').isEmail().withMessage('Invalid email'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
];

exports.registerUser = (req, res) => {
  const { username, password, transactionPassword, email, phone, referredBy } = req.body;

  User.findOne({ referralCode: referredBy, active: true })
    .then((existingUser) => {
      if (!existingUser) {
        return res.status(400).json({ error: "Invalid referral code" });
      }

      // Hash the password before saving
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: "Unable to register user" });
        }

        // Hash the transaction password before saving
        bcrypt.hash(transactionPassword, 10, (err, hashedTransactionPassword) => {
          if (err) {
            return res.status(500).json({ error: "Unable to Register User" });
          }

          const newUser = new User({
            username,
            password: hashedPassword,
            transactionPassword: hashedTransactionPassword,
            email,
            phone,
            referredBy,
            walletBalance:0
          });
          // Save the new user object to the database
          newUser.save()
            .then((user) => {
              // add new user in referral collection
              return registerUserReferral(referredBy, user.referralCode);
            })
            .then(() => {
              // If the user was saved successfully, start the job
              startActivationJob({ newUser, referredBy }).then(() => {
                return res.status(200).json({ message: "User registered successfully", newUser });
              });
            })
            .catch((err) => {
              // If there was an error saving the user, return an error response
              return res.status(500).json({ error: "Unable to register user successfuly" });
            });
        });
      });
    })
    .catch((err) => {
      // If there was an error checking the referral code, return an error response
      return res.status(500).json({ error: "Unable to register user" });
    });
};

exports.allUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password -__v");

    return res.status(200).json({ users });
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

exports.referrals = async (req, res) => {
  const referralCode = req.params.referralCode;

  try {
    const users = await User.aggregate([
      {
        $match: {
          referralCode: referralCode,
        },
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$referralCode",
          connectFromField: "referralCode",
          connectToField: "referredBy",
          as: "reportingHierarchy",
        },
      },
    ]);
    return res.status(200).json({ users });
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Invalid username or password");
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, secretKey);

    // Return user and token
    return res.status(200).json({ message: "User logged in successfully", user, token });
  } catch (err) {
    console.error("Error finding user:", err);
    return res.status(500).send("Internal Server Error");
  }
};

// exports.login = async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(401).send("Invalid username or password");
//     }
//     if (user.password !== password) {
//       return res.status(401).send("Invalid username or password");
//     }

//     if (user) {
//       const token = jwt.sign({ userId: user.id }, secretKey);
//       res.json({ user, token });
//       return res
//         .status(200)
//         .json({ message: "User logged in successfully", user });
//     } else {
//       return res.status(401).json({ message: "Invalid username or password" });
//     }
//   } catch (err) {
//     console.error("Error finding user:", err);
//     return res.status(500).send("Internal Server Error");
//   }
// };

exports.logout = async (req, res) => {
  return res.status(200).json({ message: "User logged out successfully" });
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the old password is correct
    const isOldPasswordCorrect = await bcrypt.compare(
      req.body.oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.newPassword, saltRounds);

    // Update the user's password field with the hashed password
    user.password = hashedPassword;

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  // Validate request body
  await body('id').isMongoId().withMessage('Invalid user ID').run(req);
  await body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long').run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, newPassword } = req.body;

  try {
    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    // Save updated user to database
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUserData = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('email').isEmail().withMessage('Invalid email'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username should be at least 3 characters long')
    .isAlphanumeric().withMessage('Username should only contain letters and numbers'),
  async (req, res) => {
    const { id } = req.params;
    const { email, phone, username } = req.body;

    try {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(409).json({ message: "Username is already taken" });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { email, phone, username },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
];

exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = active;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.toggleWithdrawStatus = async (req, res) => {
  const { transaction_id } = req.params;
  const { amount_withdraw_status } = req.body;

  try {
    // Find the withdrawal document by transaction ID
    const withdrawal = await withdraw.findOne({ transaction_id: transaction_id });

    if (!withdrawal) {
      // Withdrawal not found
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Update the withdrawal document with the new amount_withdraw_status
    withdrawal.amount_withdraw_status = amount_withdraw_status;

    // Save the updated document to the database
    await withdrawal.save();

    // Return the updated withdrawal document
    return res.json(withdrawal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.fileUpload = async (req, res) => {
  const { id } = req.params;
  upload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file.");
    }

    res.end("File is uploaded");
  });
}

exports.requestFund = async (req, res) => {
  const { id } = req.params;
  const { amount_requested } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const user_id = id;
  const amount_request_status = "waiting";

  const newFund = new Fund({
    transaction_id: 'TXN' + uuidv4(),
    user_id,
    amount_requested,
    amount_request_status,
  });

  const updatedWalletBalance = user.wallet_balance + amount_requested;
  user.wallet_balance = updatedWalletBalance;

  try {
    await newFund.save();
    await user.save();
    return res
      .status(200)
      .json({ message: "Add fund request sent successfully", updatedWalletBalance });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to add fund request: " + err.toString() });
  }
};

exports.withdrawFund = async (req, res) => {
  const { id } = req.params;
  const { amount_withdraw } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (amount_withdraw > user.wallet_balance) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const user_id = id;
  const amount_withdraw_status = "waiting";

  const newWithdraw = new withdraw({
    transaction_id: 'TXN' + uuidv4(),
    user_id,
    amount_withdraw,
    amount_withdraw_status,
  });

  const updatedWalletBalance = user.wallet_balance - amount_withdraw;
  user.wallet_balance = updatedWalletBalance;

  try {
    await newWithdraw.save();
    await user.save();
    return res
      .status(200)
      .json({ message: "Withdraw amount request sent successfully", updatedWalletBalance });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to withdraw amount request: " + err.toString() });
  }
};

exports.getBalance = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const funds = await Fund.aggregate([
    {
      $match: {
        user_id: id,
        amount_request_status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        total_amount: { $sum: "$amount_requested" },
      },
    },
  ]);

  const withdrawals = await Withdraw.aggregate([
    {
      $match: {
        user_id: id,
        amount_withdraw_status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        total_amount: { $sum: "$amount_withdraw" },
      },
    },
  ]);

  const referralBonus = user.referralBonus || 0;

  const balance = {
    available_balance: (funds.length ? funds[0].total_amount : 0) - (withdrawals.length ? withdrawals[0].total_amount : 0) + referralBonus,
  };

  return res.status(200).json(balance);
};




exports.withdrawHistory = async (req, res) => {
  try {
    const withdrawLists = await withdraw.find({}, "");

    return res.status(200).json({ withdrawLists });
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

exports.requestFundHistory = async (req, res) => {
  try {
    const requiredFundLists = await Fund.find({}, "");

    return res.status(200).json({ requiredFundLists });
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

// 1. Retrieve the withdraw amounts for each user from the database
exports.totalApprovedWithdrawAmount = async (req, res) => {
  try {
    // 1. Get the status parameter from the query string (defaults to 'Approved')
    const amount_withdraw_status = req.query.amount_withdraw_status || 'waiting';
    const ApprovedWithdrawAmounts = await withdraw.find({ amount_withdraw_status }).select('amount_withdraw user_id').exec();
    
    // 2. Calculate the sum of all the withdraw amounts
    const totalApprovedWithdrawAmount = ApprovedWithdrawAmounts.reduce((total, withdraw) => total + withdraw.amount_withdraw, 0);

    // 4. Update the wallet balance of each user who has a withdrawal request with the specified status
    for (const withdraw of ApprovedWithdrawAmounts) {
      const updatedUser = await User.findByIdAndUpdate(withdraw.user_id, { $inc: { walletBalance: - User.wallet_balance } }, { new: true });
    }

     // 5. Calculate the sum of all wallet balances and update the value in the database
    const allUsers = await User.find().select('wallet_balance').exec();
    const totalWalletBalance = allUsers.reduce((total, user) => total + user.wallet_balance, 0);
    await Wallet.findOneAndUpdate({}, { totalWalletBalance });

    // 3. Return the total withdraw amount to the frontend
    res.json({ totalApprovedWithdrawAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 1. Retrieve the withdraw amounts for each user from the database
exports.totalPendingWithdrawAmount = async (req, res) => {
  try {
    const PendingWithdrawAmounts = await withdraw.find({ amount_withdraw_status: 'waiting' }).select('amount_withdraw').exec();
    
    // 2. Calculate the sum of all the withdraw amounts
    const totalPendingWithdrawAmounts = PendingWithdrawAmounts.reduce((total, user) => total + user.amount_withdraw, 0);
    // 3. Return the total withdraw amount to the frontend
    res.json({ totalPendingWithdrawAmounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 1. Retrieve the withdraw amounts for each user from the database
exports.totalRejectedWithdrawAmount = async (req, res) => {
  try {
    const RejectedWithdrawAmounts = await withdraw.find({ amount_withdraw_status: 'Rejected' }).select('amount_withdraw').exec();
    
    // 2. Calculate the sum of all the withdraw amounts
    const totalRejectedWithdrawAmount = RejectedWithdrawAmounts.reduce((total, user) => total + user.amount_withdraw, 0);
    // 3. Return the total withdraw amount to the frontend
    res.json({ totalRejectedWithdrawAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTotalWalletBalance = async (req, res) => {
  try {
    const users = await User.find({}, { wallet_balance: 1, _id: 0 });
    const totalWalletBalance = users.reduce((total, user) => total + user.wallet_balance, 0);
    return res.status(200).json({ totalWalletBalance });
  } catch (err) {
    return res.status(500).json({ message: "Failed to get total wallet balance: " + err.toString() });
  }
};


exports.checkTransactionPassword = async (req, res) => {
  const { username, transactionPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    // Compare hashed password
    const match = await bcrypt.compare(
      transactionPassword,
      user.transactionPassword
    );
    if (!match) {
      return res.status(401).send("Invalid username or password");
    }

    // Return user 
    return res
      .status(200)
      .json({ message: "User verified successfully", user });
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

//Users to User Transaction 
exports.usersTransactions = async (req, res) => {
  const { id } = req.params;
  const { receiver_id, sent_amount } = req.body;

  const user = await User.findById(id);

  // Check if the receiver exists
  const receiver = await User.findById(receiver_id);
  if (!receiver) {
    return res.status(404).json({ message: 'Receiver not found.' });
  }

  const user_id = id;

  const newUserTransaction = new UsersTransactions({
    transaction_id: 'TXN' + uuidv4(),
    user_id,
    receiver_id,
    sent_amount,
  });

  // Check if the user has enough balance
  if (user.walletBalance < sent_amount) {
    return res.status(400).json({ message: 'Insufficient balance.' });
  }

  // Update the balances of the user and receiver
  user.walletBalance -= sent_amount;
  receiver.walletBalance += sent_amount;

  try {
    await newUserTransaction.save();
    await user.save();
    await receiver.save();
    return res.status(200).json({
      message: 'Amount sent successfully',
      userWalletBalance: user.walletBalance,
      receiverWalletBalance: receiver.walletBalance,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to send amount: ' + err.toString() });
  }
};


