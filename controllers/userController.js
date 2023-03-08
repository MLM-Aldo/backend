// Import the user model
const User = require('../models/user');

// Define the user controller functions
exports.registerUser = (req, res) => {
  // Extract the data from the request body
  const { username, password, email, phone,referredBy } = req.body;

  User.findOne({ referralCode: referredBy })
  .then(existingUser => {
    if (!existingUser) {
      // If the referral code is not valid, return an error response
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    // Otherwise, create a new user object using the data
    const newUser = new User({
      username,
      password,
      email,
      phone,
      referredBy
    });

    // Save the new user object to the database
    newUser.save()
    .then((user) => {
      // If the user was saved successfully, return a success response
      return res.status(200).json({ message: 'User registered successfully', user });
    })
    .catch((err) => {
      // If there was an error saving the user, return an error response
      return res.status(500).json({ error: 'Unable to register user' });
    });
  
  })
  .catch(err=> {
    // If there was an error checking the referral code or saving the user, return an error response
    return res.status(500).json({ error: 'Unable to register user' });
  });

};
