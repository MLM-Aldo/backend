const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Fund = require("../models/fund");
const withdraw = require("../models/withdraw");
const { startJob, registerUserReferral } = require("../services/referral");
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');

const crypto = require('crypto');


const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secretKey = process.env.SECRET_KEY || generateSecretKey();

// use the secretKey to sign JWT tokens
// ...


exports.registerUser = (req, res) => {
  const { username, password, email, phone, referredBy } = req.body;

  User.findOne({ referralCode: referredBy, active: true })
    .then((existingUser) => {
      if (!existingUser) {
        return res.status(400).json({ error: "Invalid referral code" });
      }

      // hash the password before saving
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: "Unable to register user" });
        }

        const newUser = new User({
          username,
          password: hashedPassword,
          email,
          phone,
          referredBy,
        });

        // sanitize user input
        newUser.username = sanitize(newUser.username);
        newUser.email = sanitize(newUser.email);
        newUser.phone = sanitize(newUser.phone);

        // Save the new user object to the database
        newUser
          .save()
          .then((user) => {
            // sanitize user data before returning
            user.username = sanitize(user.username);
            user.email = sanitize(user.email);
            user.phone = sanitize(user.phone);

            // add new user in referral collection
            return registerUserReferral(referredBy, user.referralCode);
          })
          .then(() => {
            // If the user was saved successfully, return a success response
            startJob({ newUser: userData, referredBy: referredBy }).then(() => {
              return res
                .status(200)
                .json({ message: "User registered successfully", userData });
            });
          })
          .catch((err) => {
            // If there was an error saving the user, return an error response
            return res.status(500).json({ error: "Unable to register user" });
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
  newFund.save().then(() => {
    return res
      .status(200)
      .json({ message: "Add fund request sent successfully" });
  }).catch((err)=>{
    return res
      .status(500)
      .json({ message: "Failed to add fund request: " + err.toString() });
  });
};

exports.withdrawFund = async (req, res) => {
  const { id } = req.params;
  const { amount_withdraw } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const user_id = id;
  const amount_withdraw_status = "waiting";

  const newWithdraw = new withdraw({
    transaction_id: 'TXN' + uuidv4(),
    user_id,
    amount_withdraw,
    amount_withdraw_status,
  });
  newWithdraw.save().then(() => {
    return res
      .status(200)
      .json({ message: "Withdraw Amount request sent successfully" });
  }).catch((err)=>{
    return res
      .status(500)
      .json({ message: "Failed to withdraw amount request: " + err.toString() });
  });
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