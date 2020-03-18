"use strict";
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
function fixLitmosDates_(achievements) {
    var fixedAchievements = achievements.map(function (achievement) {
        achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate).toString();
        return achievement;
    });
    return fixedAchievements;
}
/**
 * Pass in the whole company training record [] and ingest each user then each achievement therein to adjust the AchievementDate in terms of the activationDate
 * @param {User[]} allUserallUsersAchievements  comes from getAllUsersTrainingStatus()
 * @param {string|date} activationDate
 */
function adjustAchievementDatesByActivationDate_(allUserallUsersAchievements, activationDate) {
    //map through each user
    allUserallUsersAchievements.forEach(function (user) {
        user.CoursesCompleted.forEach(function (achievement) {
            achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate, activationDate);
        });
    });
    return allUserallUsersAchievements;
}
/**
 * This function takes two times and finds the number of days between them, as a decimal
 * @param t1
 * @param t2
 */
function daysBetween_(t1, t2) {
    return daysSince(millsSince(t1, t2));
}
/**
 * Loop through all users/achievements and place them onto a grid that's as many days wide as you want to report on. Default is 62 days
 * @param allUsersAchievements User[] of all training history chained from adjustAchievementDatesByActivationDate_
 * @param daysToReportOn set how many columns the reporting array should be to place users' achievements onto the sheet
 */
function buildHistoricalAchievementArray_(allUsersAchievements, daysToReportOn) {
    if (daysToReportOn === void 0) { daysToReportOn = 60; }
    //Create a 2d array, with one row per user
    var achievementsArray = Array.from(Array(allUsersAchievements.length), function () { return Array(daysToReportOn); });
    //Loop through all the achievements for a user
    //If the achievement is in the reporting window, add it to the company's achievementsArray for the proper user in the proper cell
    allUsersAchievements.forEach(function (user, userIndex) {
        user.CoursesCompleted.forEach(function (achievement, achievementIndex) {
            //Throw the UserName into the achievement's array
            achievement.UserWhoAchieved = user.UserName;
            //Decide which day's cell to fill
            var day = Math.floor(achievement.DaysIntoOnboardingWhenCompleted || 0);
            //If the day is within the scope of reporting (onboarding), add the achievement into the array
            if (day < daysToReportOn) {
                try {
                    //Make sure there actually is an achievement there
                    if (typeof achievement !== "undefined") {
                        //debugging
                        var currentValue = achievementsArray[userIndex][day];
                        //If the array is undefined, then set the first value to avoid `undefined` errors
                        if (typeof currentValue == "undefined") {
                            achievementsArray[userIndex][day] = [achievement];
                        }
                        else {
                            //The array has already been defined, so push the next achievement onto that day
                            achievementsArray[userIndex][day].push([achievement]);
                        }
                    }
                    else {
                        console.log("This is an empty achievement");
                    }
                }
                catch (err) {
                    throw new Error(err);
                }
            }
        });
    });
    return achievementsArray;
}
function getCompanyHistoricalAchievementArray_(companyID, activationDate, reportingDayLength) {
    if (reportingDayLength === void 0) { reportingDayLength = 60; }
    //Establish how far back to report, typically 60 days
    //Then format in YYYY-MM-DD for Litmos
    var reportingThreshold = formatDate(calculateDaysAgo_(reportingDayLength));
    //Search Litmos for all users with the corresponding companyID
    var allCompanyUsers = getAllCompanyUsers(companyID);
    //Get the training status for each user
    var allUserTrainingStatus = getAllUserLitmosAchievements_(allCompanyUsers, reportingThreshold);
    //Correct achievement dates so they're out of Litmos form
    var allUserTrainingStatus_properDates = allUserTrainingStatus.map(function (user) {
        user.CoursesCompleted = fixLitmosDates_(user.CoursesCompleted);
        return user;
    });
    //Correct achievement dates so they're relative to activation date
    var allUsersAchievements = adjustAchievementDatesByActivationDate_(allUserTrainingStatus_properDates, activationDate);
    //Build the historical array with the given adjusted achievements
    var historicArray = buildHistoricalAchievementArray_(allUsersAchievements, reportingDayLength);
    console.log(historicArray);
    return historicArray;
}
function calculateDaysAgo_(since) {
    var d = new Date();
    d.setDate(d.getDate() - since);
    return d;
}
function runthismydude() {
    var myw00tarray = getCompanyHistoricalAchievementArray_("308477846", "2020-02-01", 90);
    console.log(myw00tarray);
}
function displayCompanyHistoricTrainingOnSS_(companyID, onboardingStartDate, reportingThreshold) {
    if (reportingThreshold === void 0) { reportingThreshold = 60; }
    //Define the spreadsheet to display onto
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Historic Training");
    //Get all achievements for users from Litmos. 
    var companyAchievementHistory = getCompanyHistoricalAchievementArray_(companyID, onboardingStartDate, reportingThreshold);
    //Calculate the range to place onto SpreadSheet
    var rows = companyAchievementHistory.length;
    var columns = Math.max.apply(Math, (companyAchievementHistory.map(function (day) { return day.length; })));
    if (sheet)
        var r = sheet.getRange(5, 1, rows, columns).setValues(companyAchievementHistory);
}
function displayRunner() {
    displayCompanyHistoricTrainingOnSS_("308477846", "2020-02-01");
}
//# sourceMappingURL=HistoricTrainingData2.js.map