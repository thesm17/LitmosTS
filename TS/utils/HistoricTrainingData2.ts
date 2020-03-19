/**
 * Given a companyID, grab any single user (the first for the MVP), and format the users's training record as:
 * 
 * userallUsersAchievements: {
 *  FirstName: string,
 *  LastName: string
 *  Email: string,
 *  UserName: string,
 *  CoursesCompleted: [
  *   {
  *    Title: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) Date,
  *    CompliantTillDate? : string 
  *    },
  *    {
  *    CourseTitle: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) string 
  *    CompliantTillDate? : string  
  *   }
  *    ...
 *   ]   
 *  }
 *  
 */


 // Initial @param is SharpSpring companyID (3089234, eg)
 // 1. Get all litmos users with this companyID
 // 2. Consume (each) the first user and get all achievements
 // 3. Consume each achievement and return the above object
    // Adjust the date, changing it into a standard Date() 
 // 4. Reformat all data


/**
 * This function consumes the complete user achievements[] and returns the array with each {} having converted dates
 * @param achievements the complete achievements array recieved from getLitmosAchievements()
 * @returns the same set of achievements but with standardized dates
 */
function fixLitmosDates_(achievements:Achievement[]){
  let fixedAchievements = achievements.map(function (achievement){
    achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate).toString();
    return achievement;
  })
  return fixedAchievements;
}

/**
 * Pass in the whole company training record [] and ingest each user then each achievement therein to adjust the AchievementDate in terms of the activationDate
 * @param {User[]} allUserallUsersAchievements  comes from getAllUsersTrainingStatus()
 * @param {string|date} activationDate
 */
function adjustAchievementDatesByActivationDate_( allUserallUsersAchievements: User[], activationDate: string|Date) {
  //map through each user
  allUserallUsersAchievements.forEach(function(user) {
    user.CoursesCompleted.forEach(function(achievement){
      achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate,activationDate)
    })
  })
  return allUserallUsersAchievements
}

/**
 * This function takes two times and finds the number of days between them, as a decimal
 * @param t1 
 * @param t2 
 */
function daysBetween_(t1: string | Date,t2: string | Date | undefined) {
  return daysSince(millsSince(t1,t2))
}




/**
 * Loop through all users/achievements and place them onto a grid that's as many days wide as you want to report on. Default is 62 days
 * @param allUsersAchievements User[] of all training history chained from adjustAchievementDatesByActivationDate_
 * @param daysToReportOn set how many columns the reporting array should be to place users' achievements onto the sheet
 */
function buildHistoricalAchievementArray_(allUsersAchievements: User[],daysToReportOn: number = 60) {
  //Create a 2d array, with one row per user
  var achievementsArray = Array.from(Array(allUsersAchievements.length), () =>  Array(daysToReportOn));
  
 
  //Loop through all the achievements for a user
  //If the achievement is in the reporting window, add it to the company's achievementsArray for the proper user in the proper cell
  allUsersAchievements.forEach(function(user, userIndex){
    user.CoursesCompleted.forEach(function(achievement, achievementIndex){

      //Throw the UserName into the achievement's array
      achievement.UserWhoAchieved = user.UserName

      //Decide which day's cell to fill
      var day = Math.floor(achievement.DaysIntoOnboardingWhenCompleted || 0);
      
      //If the day is within the scope of reporting (onboarding), add the achievement into the array
      if (day < daysToReportOn){

        try{
          //Make sure there actually is an achievement there
          if (typeof achievement !== "undefined") {
            //debugging
            var currentValue = achievementsArray[userIndex][day]
            
            //If the array is undefined, then set the first value to avoid `undefined` errors
            if (typeof currentValue == "undefined") {
              achievementsArray[userIndex][day]=[achievement];
            }
            else {
            //The array has already been defined, so push the next achievement onto that day
              achievementsArray[userIndex][day].push(achievement);
            } 
          }
          else {
            console.log("This is an empty achievement")
          }
        } 
        catch (err)  {throw new Error(err);}
      }
    })
  })
  return achievementsArray as [[Achievement[]]];
}

/**
 * Main runner to get a company's training history as far back as you'd like. 
 * @param companyID SharpSpring company ID (eg. 308234543)
 * @param activationDate Can be pasted straight from a Google sheets date field
 * @param reportingDayLength How many days should be included in the report?
 */
  function getCompanyHistoricalAchievementArray_(companyID: string, activationDate: string| Date, reportingDayLength: number=60) {
    //Establish how far back to report, typically 60 days
    //Then format in YYYY-MM-DD for Litmos
    var reportingThreshold = formatDate(calculateDaysAgo_(reportingDayLength))

    //Search Litmos for all users with the corresponding companyID
    var allCompanyUsers = getAllCompanyUsers(companyID);

    //Get the training status for each user
    var allUserTrainingStatus = getAllUserLitmosAchievements_(allCompanyUsers, reportingThreshold);

    //Correct achievement dates so they're out of Litmos form
    var allUserTrainingStatus_properDates = allUserTrainingStatus.map(function(user){
      user.CoursesCompleted = fixLitmosDates_(user.CoursesCompleted)
      return user;
    });

    //Correct achievement dates so they're relative to activation date
    var allUsersAchievements = adjustAchievementDatesByActivationDate_(allUserTrainingStatus_properDates, activationDate);

    //Build the whole historical array with the given adjusted achievements
    var historicArray = buildHistoricalAchievementArray_(allUsersAchievements, reportingDayLength);

    //Loop through the historicArray and add each users' historical array to the User
    var userHistoricData: User[] = allUsersAchievements.map(function(user,userIndex){
      user.CourseHistory = historicArray[userIndex]
      return user;
    });
    
    return userHistoricData;
  }


function calculateDaysAgo_(since: number) {
  var d= new Date();
  d.setDate(d.getDate()-since)
  return d
}

function runthismydude(){
var myw00tarray = getCompanyHistoricalAchievementArray_("308477846","2020-02-01",90)
console.log(myw00tarray);
}




function displayCompanyHistoricTrainingOnSS_(companyID: string, onboardingStartDate: string, reportingThreshold:number = 60) {
  //Define the spreadsheet to display onto
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Historic Training");
  
  //Get all achievements for users from Litmos. 
  var userHistories= getCompanyHistoricalAchievementArray_(companyID, onboardingStartDate, reportingThreshold);

  
  //Insert beautification
  var prettyArray = beautifyHistoricalArray_(userHistories);

//gotta fix stuff

  // //Calculate the range to place onto SpreadSheet
  // var rows = combinedTimeline.length;
  // var columns = Math.max(...(combinedTimeline.map(day =>  day.length)));

  // if (sheet)
  // var r = sheet.getRange(5,3,rows,columns).setValues(combinedTimeline);

}

/**
 * Prep the achievement data to look better on a spreadsheet. 
 * 1. Remove rows for users with no data to speed up searching
 * 2. If one of them was the achievement test, put a * instead
 * 3. Instead of slamming all the achievement data into one cell, display how many courses were completed that day
 * 4. Displays "xx others users with no achievements" at the bottom
 * @param achievements 
 */
function beautifyHistoricalArray_(users: User[] ){

  //1. Strip out users with no achievements
  var strippedOutNonAchievers = users.filter(user => user.CoursesCompleted.length > 0 );

  //2. Check if any users completed the certification courses
  var certificationNoted = strippedOutNonAchievers.map(user => checkIfUserIsCertified(user));

  //3. Loop through each day and instead of returning the specific achievements, return how many there are
  //If there happened to be an certification for that user, check whether it happened that day
  //If it happened on that day, add a * to the number

  var numbericalAchievementArray = strippedOutNonAchievers.map(function (user, userIndex) {
    var numberArray = user.CourseHistory.map(function (day) {
      // var count += day.length;
    })
  })
}

/**
 * Given a User, loops through each day in the CoursesCompleted[] to see if any match the certification courses.
 * @param user 
 * @returns true for a user who has passed the certification course
 */
function checkIfUserIsCertified(user: User) {
  //Loop through each day in the user's course history and check if that course is the certification course
  var certificationBoolean = user.CourseHistory.filter(function(course){
    (checkCertificationStatus(course).certificationPercent > 0.99)
  });
  return (certificationBoolean.length>0)  
  
}

function displayRunner() {
  displayCompanyHistoricTrainingOnSS_("308477846","2020-02-01");
}