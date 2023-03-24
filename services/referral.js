const Referral = require('../models/referral');

exports.startJob = async (job) => {
     

     try {
      const referralTree = await Referral.aggregate([
         {
            $graphLookup: {
               from: "users",
               startWith: "$referredBy",
               connectFromField: "referredBy",
               connectToField: "referralCode",
               as: "reportingHierarchy"
            }
         },
         {
             $match: {
                 'referralCode': job.newUser.referralCode
             }
         }
      ]);

      if (referralTree){
         const reportingHierarchy = referralTree[0].reportingHierarchy
         reportingHierarchy
         .forEach((item,index) => {
              
                  Referral.findOne({ referralCode: item.referralCode })
                  .then(referral => {

                     let levelNumber = index + 1
                     key = 'level' + levelNumber;

                     // direct referral
                     if(levelNumber == 1){
                     referral[key] = referral[key] + 1;
                     } 
                     // level 1 user moves to level 2
                     else if (index == 1 && referral.level == 1 && referral.level1 >= 4){
                        referral.level = 2;
                        referral.level2 = 1;
                     } 
                     else {
                        referral.level = levelNumber;
                        referral[key] = referral[key] + 1;
                     }

                     return referral.save();
                  }).catch((err) => {
                     console.error('Error updating referral bonus :', err);
                     res.status(500).send('Internal Server Error');
                  });

         });

      }


     } catch (err) {
      console.error('Error updating referral bonus :', err);
      res.status(500).send('Internal Server Error');
    }

}
