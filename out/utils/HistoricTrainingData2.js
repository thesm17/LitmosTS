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
 * Given a Litmos user object, return it formatted for SharpSpring use.
 * @param user Litmos user gotten by getUser() or getAllCompanyUsers()
 * @returns the directed userTrainingStatus{}
 */
function getUserTrainingStatus_(user) {
    var coursesCompleted_raw = getLitmosAchievements(user);
    var coursesCompleted_dateCorrected = fixLitmosDates_(coursesCompleted_raw);
    var userRecord = {
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        UserName: user.UserName,
        CoursesCompleted: coursesCompleted_dateCorrected
    };
    return userRecord;
}
/**
 * This function consumes the complete user achievements[] and returns the array with each {} having converted dates
 * @param achievements the complete achievements array recieved from getLitmosAchievements()
 * @returns the same set of achievements but with standardized dates
 */
function fixLitmosDates_(achievements) {
    var fixedAchievements = achievements.map(function (achievement) {
        achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate).toString();
        return achievement;
    });
    return fixedAchievements;
}
/**
 * Pass in the whole company training record [] and ingest each user then each achievement therein to adjust the AchievementDate in terms of the activationDate
 * @param {User[]} allUserTrainingHistory  comes from getAllUsersTrainingStatus()
 * @param {string|date} activationDate
 */
function adjustAchievementDatesByActivationDate_(allUserTrainingHistory, activationDate) {
    //map through each user
    allUserTrainingHistory.forEach(function (user) {
        user.CoursesCompleted.forEach(function (achievement) {
            achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate, activationDate);
        });
    });
    return allUserTrainingHistory;
}
/**
 * This runner is for testing in the Scripts editor
 * @param companyID
 */
function HistoricTrainingRunner_clasp(companyID) {
    //getCompanyID from a spreadsheet or something
    //!FOR TESTING
    if (companyID === void 0) { companyID = "308473011"; }
    var allCompanyUsers = getAllCompanyUsers(companyID);
    var allUserTrainingStatus = getAllUsersTrainingStatus_(allCompanyUsers);
    var trainingHistory = adjustAchievementDatesByActivationDate_(allUserTrainingStatus, "2020-03-03");
    console.log(trainingHistory);
    var historicArray = buildHistoricalAchievementArray_(trainingHistory);
    console.log(historicArray);
}
/**
 * Loops through each company user and returns all their achievements
 * @param allCompanyUsers from getAllCompanyUsers()
 */
function getAllUsersTrainingStatus_(allCompanyUsers) {
    return allCompanyUsers.map(function (user) { return getUserTrainingStatus_(user); });
}
/**
 * This function takes two times and finds the number of days between them, as a decimal
 * @param t1
 * @param t2
 */
function daysBetween_(t1, t2) {
    return daysSince(millsSince(t1, t2));
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
function buildHistoricalAchievementArray_(trainingHistory, daysToReportOn) {
    if (daysToReportOn === void 0) { daysToReportOn = 62; }
    var achievementsArray = Array.from(Array(daysToReportOn), function () { return new Array(); });
    trainingHistory.forEach(function (user) {
        user.CoursesCompleted.forEach(function (achievement) {
            //Throw the UserName into the achievement's array
            achievement.UserWhoAchieved = user.UserName;
            //Decide which day's cell to fill
            var day = Math.floor(achievement.DaysIntoOnboardingWhenCompleted || 0);
            //If the day is within the scope of onboardingAdd the achievement into the array
            if (day < achievementsArray.length)
                achievementsArray[day].push(achievement);
        });
    });
    return achievementsArray;
}
//# sourceMappingURL=HistoricTrainingData2.js.map