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
router.get('/referrals/:referralCode', userController.referrals);
router.put('/:id/password', userController.updatePassword);
router.put('/:id', userController.updateUserData);
router.put('/:id/status', userController.toggleUserStatus);
router.post('/:id/requestFund', userController.requestFund);
router.post('/:id/withdrawFund', userController.withdrawFund);

// Export the user routes
module.exports = router;
