// Import the user model
const Referral = require('../models/referral');
const referralService = require('../services/referral')


// Define the user controller functions
exports.referralBonus = async (req, res) => {
    const referralCode = req.params.referralCode;

    try{
        const referralAmount = await referralService.referralBonus(referralCode);
        if(referralAmount == null){{
            res.status(500).send('Internal Server Error');
        }} else{
            return res.status(200).json({referralAmount});
        }
    } catch(err) {
        res.status(500).send('Internal Server Error');
      }
};