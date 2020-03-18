/**
 * Given a companyID, grab any single user (the first for the MVP), and format the users's training record as:
 * 
 * userTrainingHistory: {
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
 * @param {User[]} allUserTrainingHistory  comes from getAllUsersTrainingStatus()
 * @param {string|date} activationDate
 */
function adjustAchievementDatesByActivationDate_( allUserTrainingHistory: User[], activationDate: string|Date) {
  //map through each user
  allUserTrainingHistory.forEach(function(user) {
    user.CoursesCompleted.forEach(function(achievement){
      achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate,activationDate)
    })
  })
  return allUserTrainingHistory
}

/**
 * This runner is for testing in the Scripts editor
 * @param companyID 
 */
function HistoricTrainingRunner_clasp(companyID = "308473011") {
  //getCompanyID from a spreadsheet or something
  //!FOR TESTING

  

}

/**
 * This function takes two times and finds the number of days between them, as a decimal
 * @param t1 
 * @param t2 
 */
function daysBetween_(t1: string | Date,t2: string | Date | undefined) {
  return daysSince(millsSince(t1,t2))
}

function timeTestingRunner() {
  //returns 1218559000
  var m1 = millsSince("3/16/2020 22:29:19", "2020-03-03");
  //returns 14.10369212962963
  var d1 = daysSince(m1);
  //returns 0
  var t2 = millsSince(new Date());
  // This one is dicey because months are actually zero indexed, so this is actually may 24.
  var t3 = millsSince(new Date, new Date(1990, 4, 24));
  return [d1, t2, t3];
}

/**
 * Loop through all users/achievements and place them onto a grid that's as many days wide as you want to report on. Default is 62 days
 * @param trainingHistory User[] of all training history chained from adjustAchievementDatesByActivationDate_
 * @param daysToReportOn set how big the reporting array should be to place users' achievements onto the sheet
 */
function buildHistoricalAchievementArray_(trainingHistory: User[],daysToReportOn: number = 62) {
  var achievementsArray:Achievement[][]=Array.from(Array(daysToReportOn), function(){return new Array()});

  trainingHistory.forEach(function(user){
    user.CoursesCompleted.forEach(function(achievement){
      //Throw the UserName into the achievement's array
      achievement.UserWhoAchieved = user.UserName

      //Decide which day's cell to fill
      var day = Math.floor(achievement.DaysIntoOnboardingWhenCompleted || 0);
      
      //If the day is within the scope of onboarding, add the achievement into the array
      if (day<achievementsArray.length)
      achievementsArray[day].push(achievement);
    })
  })
  return achievementsArray;
}

function getCompanyHistoricalAchievementArray(companyID: string, activationDate: string| Date, reportingDayLength: number=60) {
  //Establish how far back to report, typically 60 days
  //Then format in YYYY-MM-DD for Litmos
  var reportingThreshold = formatDate(calculateDaysAgo_(reportingDayLength))

  //Search Litmos for all users with the corresponding companyID
  var allCompanyUsers = getAllCompanyUsers(companyID);

  //Get the training status for each user
  var allUserTrainingStatus = getAllUserLitmosAchievements(allCompanyUsers, reportingThreshold);

  //Correct achievement dates so they're relative to activation date
  var trainingHistory = adjustAchievementDatesByActivationDate_(allUserTrainingStatus, activationDate);
  console.log(trainingHistory)

  //Build the historical array with the given adjusted achievements
  var historicArray = buildHistoricalAchievementArray_(trainingHistory, reportingDayLength);
  console.log(historicArray);
  return historicArray;
}

function calculateDaysAgo_(since: number) {
  var d= new Date();
  d.setDate(d.getDate()-since)
  return d
}

function runthismydude(){
var myw00tarray = getCompanyHistoricalAchievementArray("308479000","2020-02-03",60)
console.log(myw00tarray);
}
