// Import the user model
const Referral = require('../models/referral');

// Define the user controller functions
exports.registerUserReferral = (referredBy, referralCode) => {

    // Otherwise, create a new user object using the data
    const newUserReferral = new Referral({
      referredBy, referralCode
    });

    // Save the new user object to the database
    return newUserReferral.save()
    .then((user) => {
        return true;
    })
    .catch((err) => {
      // If there was an error saving the user, return an error response
      return false;
    });
 

};


// // update number of people referred
// exports.updateReferralCount = (referredBy) => {
  
//       return Referral.findOne({ referralCode: referredBy }).then((referral) => {
//         if (!referral) {
//             // If the referral code is not valid, return an error response
//             return false;
//           }

//         else {
//             let count = referral.levelOneReferrals;
//             count = count + 1;
//             referral.levelOneReferrals = count 
//             return referral.save()
//         }
//       }).then((data) => {
//         return true;
//       }).catch((err) => {
//         return false;
//       });
  
      
   
  
//   };