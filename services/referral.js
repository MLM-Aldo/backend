// Import Mongoose and the Referral model
const mongoose = require('mongoose');
//const Referral = require('../models/referral');
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
const Referral = require('../models/referral');
const User = require('../models/user');

const referralSystem = process.env.REFERRAL_SYSTEM ? JSON.parse(process.env.REFERRAL_SYSTEM) : {
  "1": 25,
  "2": 4,
  "3": 3,
  "4": 2,
  "5": 1,
  "6": 1,
  "7": 1,
  "8": 1
};

exports.startActivationJob = async (activationUser) => {
    console.log("membershipfee:", activationUser.membership);
    if (typeof activationUser !== 'object' || activationUser === null) {
      console.error('Invalid activationUser:', activationUser);
      return;
    }
    let referredBy = activationUser.referredBy || '';  
    console.log('whom:', referredBy)
  
    if (!('membership' in activationUser)) {
        console.error('membership not found in activationUser:', activationUser);
        return;
      }
    const userMembership = activationUser.membership;
    console.log(userMembership);
    //const referredBy = activationUser.referredBy;
    if (activationUser.hasOwnProperty('referredBy')) {
        const referredBy = activationUser.referredBy;
        console.log('Activation user Referrer:', referredBy);
      } else {
        console.log('referredBy property does not exist in activationUser object.');
      }
    console.log('hello',referredBy);
    const top8UsersList = [];
  
    for (let i = 0; i < 8; i++) {
      const referral = await Referral.findOne({ referralCode: referredBy });
      console.log('before user', referral);
      if (referral && referral.referralCode != activationUser.referralCode) {
        top8UsersList.push(referral);
        console.log(top8UsersList.push(referral))
        referredBy = referral.referredBy;
        console.log('before user by',referredBy);
      }
    }
  
    console.log('Processing referral bonus');
    console.log(top8UsersList);
  
    // level 1 to be greater than 4 and level 1,2,3,4,5 sum should be greater than 500
    for (let i = 0; i < top8UsersList.length; i++) {
      console.log(i);
      if (i === 0) {
        const referral = top8UsersList[i];
        console.log('Processing referral :', referral);
  
        const level = i + 1;
        const key = 'level' + level;
        referral[key] = referral[key] + 1;
        referral.referralBonus = referral.referralBonus + (referralSystem['' + level] / 100) * userMembership;
        await referral.save();
        console.log("referral :", referral)
      } else {
        const referral = top8UsersList[i];
        if (referral.level1 >= 4 && i < 5) {
          const level = i + 1;
          const key = 'level' + level;
          referral[key] = referral[key] + 1;
          referral.referralBonus = referral.referralBonus + (referralSystem['' + level] / 100) * userMembership;
          await referral.save();
          console.log("referral control:", referral)
        } else {
          const totalReferrals = referral.level1 + referral.level2 + referral.level3 + referral.level4 + referral.level5;
          if (totalReferrals >= 500 && i > 4) {
            const level = i + 1;
            const key = 'level' + level;
            referral[key] = referral[key] + 1;
            referral.referralBonus = referral.referralBonus + (referralSystem['' + level] / 100) * userMembership;
            await referral.save();
            console.log("referral log :", referral)
          }
        }
      }
    }
  };
// Referral service function
exports.getReferralByCode = async (referralCode) => {
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return null;
    }
    return referral.referralBonus;
}
  
  
  