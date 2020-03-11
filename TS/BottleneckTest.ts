// Note: To support older browsers and Node <6.0, you must import the ES5 bundle instead.
var Bottleneck = require("bottleneck/es5");

const limiter = new Bottleneck({
  reservoir: 100, // initial value
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
 
  // also use maxConcurrent and/or minTime for safety
  maxConcurrent: 1,
  minTime: 333 // pick a value that makes sense for your use case
})

//count job for debugging
var counts = limiter.counts();
console.log(`Counts initialized. Number of counts: ${counts}`);

function updateRow_bn(row: number) {
  //Get the company ID from the given row by getting the value in the first column
  var companyID: string = sheet.getRange(row,1).getValue();

  //Get all the users associated with the given SharpSpring company ID from Litmos. 
  var users = getAllCompanyUsers(companyID);
  console.log(`All users gotten. Number of counts: ${counts}`);

  //If there are some users then
  if (users) {    
    //Loop through all users and get their individual achievements
    var allUserAchievements = limiter.schedule(() => {
        const allAchvs = users!.map(user => {return getUserAchievements(user.Id)})
        console.log(`In the midst of looping. Number of counts: ${counts}`);
        return Promise.all(allAchvs);
        }
      )
    
    console.log(`Looping finished. Number of counts: ${counts}`);
    
    //Get them all into a 1d array
    var allCompanyAchievements: string[]=allUserAchievements.join().split(",");
    
    //Get all the unique course completions
    //This does lose number of unique completions, but that's ok in this case since we're just backfilling
    var uniqueCompanyAchievements: string[]= allCompanyAchievements.filter(onlyUnique);

    //For each achievement, pretend that it's being posted through a webhook and run it!
    var results = backfillRunner(companyID, uniqueCompanyAchievements, row);

    return allCompanyAchievements;
  }
}