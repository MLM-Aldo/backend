// Import required modules
const express = require('express');
const userController = require('../controllers/userController');

// Create a new instance of the user routes
const router = express.Router();

// Define the user routes
router.post('/register', userController.registerUser);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/allUsers', userController.allUsers);


// Export the user routes
module.exports = router;
