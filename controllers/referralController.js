// Import the user model
const Referral = require('../models/referral');
const referralService = require('../services/referral')

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

// Define the user controller functions
exports.referralBonus = async (req, res) => {
    const referralCode = req.params.referralCode;
    try{
        const referralAmount = await referralService.getReferralByCode(referralCode);
        if(referralAmount == null){{
            res.status(500).send('Internal Server Error');
        }} else{
            return res.status(200).json({referralAmount});
        }
    } catch(err) {
        res.status(500).send('Internal Server Error');
      }      
};