"use strict";
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
function fixLitmosDates(achievements) {
    var fixedAchievements = achievements.map(function (achievement) {
        achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate);
        return achievement;
    });
    return fixedAchievements;
}
/**
 * Given a Litmos user object, return it formatted for SharpSpring use.
 * @param user Litmos user gotten by getUser() or getAllCompanyUsers()
 * @returns the directed userTrainingStatus{}
 */
function getUserTrainingStatus(user) {
    var coursesCompleted_raw = getLitmosAchievements(user);
    var coursesCompleted_dateCorrected = fixLitmosDates(coursesCompleted_raw);
    return {
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        UserName: user.UserName,
        CoursesCompleted: coursesCompleted_dateCorrected
    };
}
function HistoricTrainingRunner_clasp() {
    //getCompanyID from a spreadsheet or something
    //!FOR TESTING
    var companyID = "308480811";
    var allCompanyUsers = getAllCompanyUsers(companyID);
    var allUserTrainingHistory = allCompanyUsers.map(function (user) { return getUserTrainingStatus(user); });
    console.log("All done!");
}
//# sourceMappingURL=HistoricTrainingData2.js.map