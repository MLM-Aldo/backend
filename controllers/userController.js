// Import the user model
const User = require('../models/user');
const { addTask } = require('../helper/queue');
const { startJob } = require('../services/referral')

const referralController = require('../controllers/referralController');

// Define the user controller functions
exports.registerUser = (req, res) => {
  // Extract the data from the request body
  const { username, password, email, phone,referredBy } = req.body;

User.findOne({ referralCode: referredBy , active: true})
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

    let userData = "";
    // Save the new user object to the database
    newUser.save()
    .then((user) => {
      userData = user;
      // add new user in referral collection
      return referralController.registerUserReferral(referredBy,user.referralCode)
    })
    // .then(() => {
    //   return referralController.updateReferralCount(referredBy)
    // })
    .then(() => {
       // If the user was saved successfully, return a success response
      startJob({newUser: userData, referredBy: referredBy}).then(() => {
        return res.status(200).json({ message: 'User registered successfully' , userData});
      })
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
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user with the given username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    // Check if the password is correct
    if (user.password !== password) {
      return res.status(401).send('Invalid username or password');
    }

    // Set user ID in session
    req.session.userId = user._id;


    // Send the session ID back to the client
    return res.status(200).json({ message: 'User logged in succesfully',user });

  } catch (err) {
    console.error('Error finding user:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.allUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({users});
  } catch(err) {
    res.status(500).send('Internal Server Error');
  }
};

exports.logout = async (req, res) => {
   // Clear the session
   req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      return res.status(200).json({ message: 'User logged out succesfully' });
    }
  });
};

