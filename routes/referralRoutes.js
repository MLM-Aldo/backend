// Import required modules
const express = require('express');
const referralController = require('../controllers/referralController');

// Create a new instance of the user routes
const router = express.Router();

router.get('/referralBonus/:referralCode', referralController.referralBonus);


// Export the user routes
module.exports = router;
