// Import required modules
const express = require("express");
const userController = require("../controllers/userController");
const multer = require('multer');

// Configure multer to store uploaded files in the desired folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets/images');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// Create a new instance of the user routes
const router = express.Router();

const upload = require("../middleware/multerFileFTP");

const uploadFolder = multer({ storage: storage });

// Define the user routes
router.post("/register", userController.registerUser);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/allUsers", userController.allUsers);
router.get("/referrals/:referralCode", userController.referrals);
router.put("/:id/password", userController.updatePassword);
router.put("/:id", userController.updateUserData);
router.put("/:id/status", userController.toggleUserStatus);
router.post("/:id/requestFund", userController.requestFund);
router.post("/fileUpload", upload, userController.fileUpload);
router.post("/:id/withdrawFund", userController.withdrawFund);
router.get("/:id/withdrawHistory", userController.withdrawHistory);
router.get("/:id/requestFundHistory", userController.requestFundHistory);
router.put(
  "/withdraw/transaction_id/:transaction_id/amount_withdraw_status",
  userController.toggleWithdrawStatus
);
router.post("/resetPassword", userController.resetPassword);
router.get(
  "/totalApprovedWithdrawAmount",
  userController.totalApprovedWithdrawAmount
);
router.get(
  "/totalPendingWithdrawAmount",
  userController.totalPendingWithdrawAmount
);
router.get(
  "/totalRejectedWithdrawAmount",
  userController.totalRejectedWithdrawAmount
);
router.get("/:id/getBalance", userController.getBalance);
router.get("/wallet-balances", userController.getTotalWalletBalance);
router.post(
  "/:id/transactionPassword",
  userController.checkTransactionPassword
);
router.post("/:id/UsersTransactions", userController.usersTransactions);
router.get("/:id/userTransactionHistory", userController.userTransactionHistory);
router.get("/referrals/:referralCode/users", userController.directReferrals);
router.get("/:id/getBalance", userController.getBalance);
router.put("/:id/activatewallet", userController.activateWallet);
router.get("/:id/currentUser", userController.currentUser);
router.get("/allWithdrawLists",userController.allWithdrawLists);
router.get("/getWithdrawLists",userController.getWithdrawLists);
router.post("/:id/uploadBanner", userController.bannerImage);
// Export the user routes
module.exports = router;
