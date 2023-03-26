const Referral = require('../models/referral');
const registerationAmount = process.env.REGISTERATION_FEE ? parseInt(process.env.REGISTERATION_FEE) : 125;
const referralSystem =  process.env.REFERRAL_SYSTEM ? JSON.parse(process.env.REFERRAL_SYSTEM):  {"1":25,"2":4,"3":3,"4":2,"5":1};

exports.startJob = async (job) => {
   try {
       const referralTree = await Referral.aggregate([
           {
               $match: {
                   'referralCode': job.newUser.referralCode
               }
           },
           {
               $graphLookup: {
                   from: "referrals",
                   startWith: job.newUser.referredBy,
                   connectFromField: "referredBy",
                   connectToField: "referralCode",
                   as: "reportingHierarchy"
               }
           },
       ]);

       if (referralTree) {
           let reportingHierarchy = referralTree[0].reportingHierarchy;

           // fix the hierarchy 
           let temp = [];

           let i = 0;
           let prev = job.newUser.referredBy;
           while (i < reportingHierarchy.length){  
            let node = reportingHierarchy.filter(r => r.referralCode == prev)[0];
            temp.push(node);
            prev = node.referredBy;
            i = i + 1;
           }

           reportingHierarchy = temp;

           let saveArr = [];

           for (let index = 0; index < reportingHierarchy.length; index++) {
               const referral = await Referral.findOne({ referralCode: reportingHierarchy[index].referralCode });
               let levelNumber = index + 1;
               let key = 'level' + levelNumber;

               // direct referral
               if (index === 0) {
                   referral.level1 = referral.level1 + 1;
               }
               // level 1 user moves to level 2
               else if (index === 1 && referral.level === 1 && referral.level1 >= 4) {
                   referral.level = 2;
                   referral.level2 = 1;
               }
               else if (index === 1 && referral.level === 1 && referral.level1 <= 4) {
                   // no commission till referral of 4 people
               }
               // dont move up levels . just update the value of level
               else if (referral.level === levelNumber || referral.level > levelNumber) {
                   referral[key] = referral[key] + 1;
               }
               // move up level for other levels
               else if (referral.level + 1 === levelNumber) {
                   referral.level = levelNumber;
                   referral[key] = referral[key] + 1;
               }

               saveArr.push(referral);
           }

           for (const referral of saveArr) {
               await referral.save();  
           }
       }
   } catch (err) {
       console.error('Error updating referral bonus :', err);
       res.status(500).send('Internal Server Error');
   }
}

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

// Define the user controller functions
exports.referralBonus = async( referralCode) => {
    try{
        const referral = await Referral.findOne({referralCode: referralCode});
        const level = parseInt(referral.level);
        
        let amount = 0;
        for (let i = 1; i < level+1; i++){
            if(referral['level'+i]  > 0){
                let bonus = referral['level'+i] * (referralSystem[''+i] / 100) * registerationAmount;
                amount = amount + bonus;
            }
        }

        return amount;
    } catch(err) {
        return null;

    }

 

};