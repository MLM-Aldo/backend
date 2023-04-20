// Import Mongoose and the Referral model
const mongoose = require('mongoose');
// const Referral = require('../models/referral');

// Calculate referral bonus based on referral hierarchy and registration amount
// function calculateReferralBonus(referrer, referredBy, registrationAmount, referralSystem) {
//   const levels = referredBy.split(',');
//   let bonus = 0;
//   let level1Count = 0;

//   for (let i = 0; i < levels.length; i++) {
//     const level = i + 1;
//     const referrerLevel = levels[i];

//     if (level === 1) {
//       level1Count++;
//     }

//     if (referralSystem.hasOwnProperty(`level${level}`) && referralSystem[`level${level}`] > 0) {
//       bonus += registrationAmount * referralSystem[`level${level}`];
//     }
//   }

//   if (level1Count < 4) {
//     return null;
//   }

//   return bonus;
// }

// // Export service functions
// module.exports = {
//   // Create a new referral document with the given data
//   async createReferral(referrer, referralCode, referredBy) {
//     const referral = new Referral({
//       referredBy,
//       referralCode,
//     });

//     try {
//       await referral.save();

//       // Calculate and update referral bonus for referrer
//       const referralSystem = {
//         level1: 0.25,
//         level2: 0.04,
//         level3: 0.03,
//         level4: 0.02,
//         level5: 0.01,        
//       };
      
//       const bonus = calculateReferralBonus(referrer, referredBy, referral.registrationAmount, referralSystem);
//       if (bonus !== null) {
//         referral.referralBonus = bonus;
//         referral.totalBonus = bonus;
//         await referral.save();
//       }

//       return referral;
//     } catch (err) {
//       throw new Error(err.message);
//     }
//   },

//   // Get a referral document by its referral code
//   async getReferralByCode(referralCode) {
//     try {
//       const referral = await Referral.findOne({ referralCode });
//       return referral;
//     } catch (err) {
//       throw new Error(err.message);
//     }
//   },

//   // Update a referral document with new data
//   async updateReferral(referral, data) {
//     try {
//       Object.assign(referral, data);
//       await referral.save();
//       return referral;
//     } catch (err) {
//       throw new Error(err.message);
//     }
//   }
// }; 



// const Referral = require('../models/referral');
// const registerationAmount = process.env.REGISTERATION_FEE ? parseInt(process.env.REGISTERATION_FEE) : 125;
// //const referralSystem =  process.env.REFERRAL_SYSTEM ? JSON.parse(process.env.REFERRAL_SYSTEM):  {"1":25,"2":4,"3":3,"4":2,"5":1,"6":1,"7":1,"8":1};

// exports.startJob = async (job) => {
//     const referralSystem = {
//         level1: 0.25,
//         level2: 0.04,
//         level3: 0.03,
//         level4: 0.02,
//         level5: 0.01, 
//         level6: 0.01,
//         level7: 0.01,
//         level8: 0.01       
//       };
      
//       function calculateReferralBonus(referrer, referredBy, registrationAmount) {
//         const levels = referredBy.split(',');
//         let bonus = 0;
//         let level1Count = 0;
      
//         for (let i = 0; i < levels.length; i++) {
//           const level = i + 1;
//           const referrerLevel = levels[i];
      
//           if (level === 1) {
//             level1Count++;
//           }
      
//           if (referralSystem.hasOwnProperty(`level${level}`) && referralSystem[`level${level}`] > 0) {
//             bonus += registrationAmount * referralSystem[`level${level}`];
//           }
//         }
      
//         if (level1Count < 4) {
//           return null;
//         }
      
//         return bonus;
//       }
      
//     }

//     try {
//        const referralTree = await Referral.aggregate([
//            {
//                $match: {
//                    'referralCode': job.newUser.referralCode
//                }
//            },
//            {
//                $graphLookup: {
//                    from: "referrals",
//                    startWith: job.newUser.referredBy,
//                    connectFromField: "referredBy",
//                    connectToField: "referralCode",
//                    as: "reportingHierarchy"
//                }
//            },
//        ]);

//        if (referralTree) {
//            let reportingHierarchy = referralTree[0].reportingHierarchy;

//            // fix the hierarchy 
//            let temp = [];

//            let i = 0;
//            let prev = job.newUser.referredBy;
//            while (i < reportingHierarchy.length){  
//             let node = reportingHierarchy.filter(r => r.referralCode == prev)[0];
//             temp.push(node);
//             prev = node.referredBy;
//             i = i + 1;
//            }

//            reportingHierarchy = temp;

//            let saveArr = [];

//            for (let index = 0; index < reportingHierarchy.length; index++) {
//                const referral = await Referral.findOne({ referralCode: reportingHierarchy[index].referralCode });
//                let levelNumber = index + 1;
//                let key = 'level' + levelNumber;

//                // direct referral
//                if (index === 0) {
//                    referral.level1 = referral.level1 + 1;
//                }
//                // level 1 user moves to level 2
//                else if (index === 1 && referral.level === 1 && referral.level1 >= 4) {
//                    referral.level = 2;
//                    referral.level2 = 1;
//                }
//                else if (index === 1 && referral.level === 1 && referral.level1 <= 4) {
//                    // no commission till referral of 4 people
//                }
//                // dont move up levels . just update the value of level
//                else if (referral.level === levelNumber || referral.level > levelNumber) {
//                    referral[key] = referral[key] + 1;
//                }
//                // move up level for other levels
//                else if (referral.level + 1 === levelNumber) {
//                    referral.level = levelNumber;
//                    referral[key] = referral[key] + 1;
//                }

//                saveArr.push(referral);
//            }

//            for (const referral of saveArr) {
//                await referral.save();  
//            }
//        }
//    } catch (err) {
//        console.error('Error updating referral bonus :', err);
//        res.status(500).send('Internal Server Error');
//    }

// // Define the user controller functions
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

// // Define the user controller functions
// exports.referralBonus = async( referralCode) => {
//     try{
//         const referral = await Referral.findOne({referralCode: referralCode});
//         const level = parseInt(referral.level);
        
//         let amount = 0;
//         for (let i = 1; i < level+1; i++){
//             if(referral['level'+i]  > 0){
//                 let bonus = referral['level'+i] * (referralSystem[''+i] / 100) * registerationAmount;
//                 amount = amount + bonus;
//             }
//         }

//         return amount;
//     } catch(err) {
//         return null;

//     }

 

// };




const Referral = require('../models/referral');
const registerationAmount = process.env.REGISTERATION_FEE ? parseInt(process.env.REGISTERATION_FEE) : 125;
const referralSystem =  process.env.REFERRAL_SYSTEM ? JSON.parse(process.env.REFERRAL_SYSTEM):  {"1":25,"2":4,"3":3,"4":2,"5":1,"6":1,"7":1,"8":1};

exports.startActivationJob = async (activationUser) => {
    var referredBy = activationUser.referredBy;
    var top8UsersList = [];
    for (i = 0; i < 8; i++){
        const referral = await Referral.findOne({ referralCode: referredBy });
        console.log(referral);
        if(referral && referral.referralCode != activationUser.referralCode){
            top8UsersList.push(referral);
            referredBy = referral.referredBy;
        }
        
    }
    console.log('Processing referral bonus');
    // level 1 to be greater than 4  and level 1,2,3,4,5 sum should be greater than 500
    for (i = 0; i < top8UsersList.length; i++){
        if(i === 0){
        const referral = top8UsersList[i];
        
        const level = i+1;
        const key = 'level' + level;
        referral[key] = referral[key] + 1;
        referral.referralBonus = referral.referralBonus + (referralSystem[''+level] / 100) * registerationAmount;
        console.log(referral.referralCode + ' giving bonus of 1st level user' + (referralSystem[''+level] / 100) * registerationAmount);
        await referral.save();
    }
else {
        const referral = top8UsersList[i];
        if(referral.level1 >= 4 && i < 5){
            const level = i+1;
            const key = 'level' + level;
            referral[key] = referral[key] + 1;
            referral.referralBonus = referral.referralBonus + (referralSystem[''+level] / 100) * registerationAmount;
            console.log(referral.referralCode + ' giving bonus of (level 1 above 4)' + (referralSystem[''+level] / 100) * registerationAmount);
            await referral.save();
        }
        else {
            totalReferreals = referral.level1 + referral.level2 + referral.level3 + referral.level4 + referral.level5;
            if(totalReferreals >= 500 && i > 4){
                const level = i+1;
                const key = 'level' + level;
                referral[key] = referral[key] + 1;
                referral.referralBonus = referral.referralBonus + (referralSystem[''+level] / 100) * registerationAmount;
                console.log(referral.referralCode + ' giving bonus of (above 500 members) ' + (referralSystem[''+level] / 100) * registerationAmount);
                await referral.save();
            }
        }
}}

};