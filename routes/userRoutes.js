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
router.get('/:id/withdrawHistory', userController.withdrawHistory);
router.get('/:id/requestFundHistory', userController.requestFundHistory);
router.put('/:user_id/withdrawals/:transaction_id/withdrawStatus', userController.toggleWithdrawStatus);

// Export the user routes
module.exports = router;
