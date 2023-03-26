const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { startJob, registerUserReferral } = require('../services/referral')

exports.registerUser = (req, res) => {
  const { username, password, email, phone, referredBy } = req.body;

  User.findOne({ referralCode: referredBy, active: true })
    .then((existingUser) => {
      if (!existingUser) {
        return res.status(400).json({ error: "Invalid referral code" });
      }

      const newUser = new User({
        username,
        password,
        email,
        phone,
        referredBy,
      });

    let userData = "";
    // Save the new user object to the database
    newUser.save()
    .then((user) => {
      userData = user;
      // add new user in referral collection
      return registerUserReferral(referredBy,user.referralCode);
    })
    // .then(() => {
    //   return referralController.updateReferralCount(referredBy)
    // })
    .then(() => {
      delete user._doc.password;
      delete user._doc.__v;

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
    })
    .catch((err) => {
      // If there was an error checking the referral code or saving the user, return an error response
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
    if (user.password !== password) {
      return res.status(401).send("Invalid username or password");
    }

    if (user) {
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);
      res.json({ user, token });
      return res.status(200).json({ message: "User logged in successfully", user });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Error finding user:", err);
    return res.status(500).send("Internal Server Error");
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({ message: "User logged out successfully" });
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the old password is correct
    if (req.body.oldPassword != user.password) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    // update the user's password field
    user.password = req.body.newPassword;

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
