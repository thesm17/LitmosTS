"use strict";
/**
 * Given a companyID, grab any single user (the first for the MVP), and format the users's training record as:
 *
 * userTrainingHistory: {
 *  FullName: string,
 *  Email: string,
 *  UserName: string,
 *  CoursesCompleted: [
  *   {
  *    Title: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) Date
  *    },
  *    {
  *    CourseTitle: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) Date
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
//getCompanyID from a spreadsheet or something
//!not real
var companyID = "308468531";
var allCompanyUsers = getAllCompanyUsers(companyID);
var allUsersAchievements = allCompanyUsers.map(function (user) {
    var coursesCompleted_raw = getLitmosAchievements(user);
    var coursesCompleted_dateCorrected = fixLitmosDates(coursesCompleted_raw);
});
/**
 * This function consumes the complete achievements[] and returns each {} with converted dates
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
//# sourceMappingURL=HistoricTrainingData2.js.map