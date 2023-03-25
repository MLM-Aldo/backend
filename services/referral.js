const Referral = require('../models/referral');

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