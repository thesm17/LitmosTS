"use strict";
function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Training History')
        .addItem('Get User History for cID at A2', 'displayIndividualUserResults_')
        .addToUi();
}
function displayCompanyHistoricTrainingResultsOnOnRow_(row) {
    //Prep the sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Company Training By Day");
    if (!sheet) {
        console.log("Oh no! The spreadsheet \"Company Training By Day\" couldn't be found");
        throw new Error("Oh no! The spreadsheet \"Company Training By Day\" couldn't be found");
    }
    ;
    console.log("Getting companyID and OBSD from spreadsheet.");
    //Grab the companyID
    var _a = sheet.getRange(row, 1, 1, 2).getValues()[0], cID = _a[0], obsd = _a[1];
    //If there isn't a companyID  in column 1, alert the user.
    if (cID == "") {
        console.log("There isn't a company id in column 1 for row " + row + ". Unable to continue.");
        throw new Error("There isn't a company id in column 1 for row " + row + ". Unable to continue.");
    }
    try {
        if (obsd) {
            //Everything looks good; time to process training history.
            console.log("Attempting to process training history for " + cID + " with an OBSD of " + obsd);
        }
        else {
            //No onboarding start date could be found
            obsd = calculateDaysAgo_(60);
            console.log("Unable to find an onboarding start date for " + cID + " in column B. Attempting to run the report as if the OBSD were exactly 60 days ago, with " + obsd + ".");
        }
        //Let's get to displayin'!
        var dataToDisplay = getCompanyHistoricTraining_(cID, obsd, true, sheet)[0];
        //Fill all the empty cells so it doesn't do weird things
        dataToDisplay = Array.from(dataToDisplay, function (item) { return item || " "; });
        var postingResults = postCompanyHistoricTrainingToSS_(dataToDisplay, sheet, row);
        return postingResults;
    }
    catch (err) {
        console.log("Oh no something went wrong!\n " + err);
        throw new Error("Oh no something went wrong!\n " + err);
    }
}
function displayIndividualUserResults_() {
    var sheet = SpreadsheetApp.getActiveSheet();
    //Validating that it's the proper sheet
    if (sheet.getName() !== "Historic Training") {
        SpreadsheetApp.getUi().alert("Run this function on the 'Historic Training' sheet plz :)");
        throw new Error();
    }
    ;
    console.log("Here we go!");
    //Grab the companyID
    var cID = sheet.getRange(2, 1).getValue();
    //If there isn't one, alert the user.
    if (cID == "") {
        SpreadsheetApp.getUi().alert("There's no company ID in cell A2. Please put one in and try again.");
        throw new Error("There's no company ID in cell A2. Please put one in and try again.");
    }
    try {
        var dataToPutOntoSheet;
        console.log("Searching for OBSD for " + cID + ".");
        var obsd = findOBSD_(cID).toString();
        console.log("Tried finding OBST; results are: " + obsd + "\n Length: " + obsd.length);
        if (obsd.length > 0) {
            try {
                console.log("Can I cast the obst as a date? " + obsd);
            }
            catch (err) {
                console.log("Issue casting the osbd as a date: " + err);
            }
            console.log("Onboarding start date found: " + obsd + ".");
            dataToPutOntoSheet = getCompanyHistoricTraining_(cID, obsd);
        }
        else {
            //No onboarding start date could be found
            console.log("Unable to find an onboarding start date for " + cID + " in column N of sheet 'Training Status by AM' in spreadsheet 'Sales Cohort Training Status Tracker'. Attempting to run the report as if the OBST were exactly 60 days ago.");
            obsd = calculateDaysAgo_(60);
            console.log("Onboarding start date was not found. Attempting instead with " + obsd);
            dataToPutOntoSheet = getCompanyHistoricTraining_(cID, obsd);
        }
        var postResults = postAllUsersToSheet_(dataToPutOntoSheet, obsd.toString(), sheet);
        return postResults;
    }
    catch (err) {
        SpreadsheetApp.getUi().alert("Oh no something went wrong!\n " + err);
    }
}
/**
 * Main runner to get a company's training history as far back as you'd like.
 * @param companyID SharpSpring company ID (eg. 308234543)
 * @param activationDate Can be pasted straight from a Google sheets date field
 * @param reportingDayLength How many days should be included in the report?
 */
function getCompanyHistoricalAchievementArray_(companyID, onboardingStartDate, reportingDayLength, getOneCompanyRow) {
    if (reportingDayLength === void 0) { reportingDayLength = 60; }
    if (getOneCompanyRow === void 0) { getOneCompanyRow = false; }
    //Establish how far back to report, typically 60 days
    //Then format in YYYY-MM-DD for Litmos
    var reportingThreshold = formatDate(calculateDaysAgo_(reportingDayLength));
    //Search Litmos for all users with the corresponding companyID
    //Get the training status for each user
    //Correct achievement dates so they're out of Litmos form
    var allUserTrainingStatus_properDates = getCompanyUserAchievements(companyID, reportingThreshold);
    //Correct achievement dates so they're relative to activation date
    console.log("Adjusting dates so they are based on OBST.");
    var allUsersAchievements = adjustAchievementDatesByOBSD_(allUserTrainingStatus_properDates, onboardingStartDate);
    //Build the whole historical array with the given adjusted achievements
    var historicArray = buildHistoricalAchievementArray_(allUsersAchievements, reportingDayLength);
    //Loop through the historicArray and add each users' historical array to the User
    console.log("Adding the course history record to each user object.");
    var userHistoricData = allUsersAchievements.map(function (user, userIndex) {
        user.CourseHistory = historicArray[userIndex];
        return user;
    });
    return userHistoricData;
    /**
     * * HELPER FUNCTIONS!!!!!!!
     * * HELPER FUNCTIONS!!!!!!!
     */
    /**
   * Pass in the whole company training record [] and ingest each user then each achievement therein to adjust the AchievementDate in terms of the activationDate
   * @param {User[]} allUserallUsersAchievements  comes from getAllUsersTrainingStatus()
   * @param {string|date} activationDate
   */
    function adjustAchievementDatesByOBSD_(allUserallUsersAchievements, activationDate) {
        //map through each user
        allUserallUsersAchievements.forEach(function (user) {
            user.CoursesCompleted.forEach(function (achievement) {
                achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate, activationDate);
                achievement.DaysAgoWhenCompleted = daysBetween_(achievement.AchievementDate);
            });
        });
        return allUserallUsersAchievements;
        /**
         * * HELPER FUNCTIONS!!!!!!!
         * * HELPER FUNCTIONS!!!!!!!
         */
        /**
         * This function takes two times and finds the number of days between them, as a decimal
         * @param t1 Time 1
         * @param t2 Time 2, or leave empty to compare it with now
         */
        function daysBetween_(t1, t2) {
            return daysSince(millsSince(t1, t2));
        }
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
                                achievementsArray[userIndex][day].push(achievement);
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
}
function postCompanyHistoricTrainingToSS_(dataToDisplay, sheet, row) {
    try {
        //Let post on the sheet the row which is being updated currently
        var postedRow = sheet.getRange(2, 3).setValue("Row " + row);
        var postMe = sheet.getRange(row, 4, 1, dataToDisplay.length).setValues([dataToDisplay]);
        return postMe;
    }
    catch (err) {
        throw new Error(err);
    }
}
function getCompanyHistoricTraining_(companyID, onboardingStartDate, outputSingleCompanyRow, sheet, reportingThreshold) {
    if (outputSingleCompanyRow === void 0) { outputSingleCompanyRow = false; }
    if (sheet === void 0) { sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Historic Training"); }
    if (reportingThreshold === void 0) { reportingThreshold = 180; }
    //Make sure the sheet exists
    if (!sheet)
        throw new Error("No sheet given or sheet doesn't exist.");
    //Get all achievements for users from Litmos. 
    console.log("Getting user achievements:\n\t");
    var userHistories = getCompanyHistoricalAchievementArray_(companyID, onboardingStartDate, reportingThreshold);
    //How many days ago was their most recent achievement?
    var daysSinceLastAchievement = Math.min.apply(Math, userHistories.map(function (user) {
        return Math.min.apply(Math, user.CoursesCompleted.map(function (course) {
            return course.DaysAgoWhenCompleted;
        }));
    }));
    if (!isFinite(daysSinceLastAchievement))
        daysSinceLastAchievement = "N/A";
    //Count the achievements for later
    var totalNumberAchievements = 0;
    var totalUserCertifications = 0;
    userHistories.forEach(function (user) {
        totalNumberAchievements += user.CoursesCompleted.length;
        totalUserCertifications += checkCertificationStatus(user.CoursesCompleted).certificationComplete;
    });
    var totalUsersWithAchievements = stripOutUsersWithoutAchievements_(userHistories).length;
    //Insert beautification
    console.log("Beautifying array.");
    var prettyArray = beautifyHistoricalArray_(userHistories, outputSingleCompanyRow);
    //Return the range array, return to be posted
    if (outputSingleCompanyRow) {
        var companyTrainingStatus = getCompanyTrainingStatus2_(prettyArray[0], totalNumberAchievements, totalUserCertifications, daysSinceLastAchievement, userHistories.length);
        var dataPlusHeaderColumns = prepSingleComppanyRowForPosting_(prettyArray, companyTrainingStatus, daysSinceLastAchievement, totalNumberAchievements, totalUsersWithAchievements, totalUserCertifications);
        return dataPlusHeaderColumns;
    }
    else
        return prettyArray;
}
function stripOutUsersWithoutAchievements_(users) {
    //1. Strip out users with no achievements
    console.log("Stripping out users without achievements. Pre-strip total: " + users.length + " Litmos accounts for this company");
    var strippedOutNonAchievers = users.filter(function (user) { return user.CoursesCompleted.length > 0; });
    console.log("After stripping, number of users with achievements: " + strippedOutNonAchievers.length + ".");
    return strippedOutNonAchievers;
}
function getParallelCertificationArray_(users) {
    //2. Check if any users completed the certification courses
    console.log("Checking for certified users.");
    var certificationNoted = users.map(function (user) { return checkIfUserIsCertified_(user); });
    //smash down empty user achievement arrays so that all they have are days someone got certified.
    var userCertified = certificationNoted.map(function (user) {
        return user.filter(function (dailyAch) { return (dailyAch > -1); });
    });
    return userCertified;
}
function transformAchievementsToNumber_(users, certificationNoted) {
    //3. Loop through each day and instead of returning the specific achievements, return how many achievements there are
    //If one of the achievements was a certification achievement, add a * to the number
    console.log("Transforming all achievements into numbers and certification achievements into *s");
    var numericalAchievementArray = transformDailyAchievementArrayIntoNumericalArray_(users, certificationNoted);
    return numericalAchievementArray;
}
/**
 * 4. Takes a whole company's user's records and smashes them into one "user"[]
 * @param numericalAchievementArray
 */
function combineMultipleUsersIntoOneCompanyAchievementRow_(users) {
    //Given a list of users[], combine them into one big user
    console.log("Combining all users together. From " + users.length + " down to 1.");
    if (users.length > 0) {
        //Combine the users together with this reducing function
        var combinedAchievements = [];
        var combinedDailyAchievements = [[]];
        users.forEach(function (user, userIndex) {
            //Put all the achievements into the one CoursesCompleted key
            user.CoursesCompleted.forEach(function (achievement, courseIndex) {
                combinedAchievements.push(achievement);
            });
            //Put all the achievements into the proper day
            user.CourseHistory.forEach(function (day, dayIndex) {
                var _a;
                if (combinedDailyAchievements[dayIndex]) {
                    (_a = combinedDailyAchievements[dayIndex]).push.apply(_a, day);
                }
                else
                    combinedDailyAchievements[dayIndex] = day;
            });
        });
        users[0].CoursesCompleted = combinedAchievements;
        users[0].CourseHistory = combinedDailyAchievements;
        return [users[0]];
    }
    else
        return users;
}
/**
 * Prep the achievement data to look better on a spreadsheet.
 * 1. Remove rows for users with no data to speed up searching
 * 2. Check if any achievements were certifications
 * 3. Transform the actual achievement data into numbers, with * for certificaiton days (eg. `4*`)
 * 4. Displays "xx others users with no achievements" at the bottom
 * @param users comes from getCompanyHistoricalAchievementArray_()
 * @param outputSingleCompanyRow tells whether to output as one company row or as individual user rows.
 */
function beautifyHistoricalArray_(users, outputSingleCompanyRow) {
    if (outputSingleCompanyRow === void 0) { outputSingleCompanyRow = false; }
    //1. Strip out users with no achievements
    var strippedOutNonAchievers = stripOutUsersWithoutAchievements_(users);
    //1b. OPTIONAL Smash all users into one array
    if (outputSingleCompanyRow) {
        strippedOutNonAchievers = combineMultipleUsersIntoOneCompanyAchievementRow_(strippedOutNonAchievers);
    }
    //2. Check if any users completed the certification courses
    var parallelCertification = getParallelCertificationArray_(strippedOutNonAchievers);
    //3. Loop through each day and instead of returning the specific achievements, return how many achievements there are
    //If one of the achievements was a certification achievement, add a * to the number
    var numericalAchievementArray = transformAchievementsToNumber_(strippedOutNonAchievers, parallelCertification);
    //If it's going to be a multi-row individual post, prep it.
    if (!outputSingleCompanyRow) {
        //Loop through each user and add their name and if they earned at least one certification achievement into the first two cells
        console.log("adding names and stuff at the beginning of the achievement arrays");
        numericalAchievementArray.forEach(function (user, userIndex) {
            user.unshift("" + strippedOutNonAchievers[userIndex].UserName, strippedOutNonAchievers[userIndex].FirstName + " " + strippedOutNonAchievers[userIndex].LastName, "" + (parallelCertification[userIndex].length > 0));
        });
        console.log("Numerical array with names added. Example first row: " + numericalAchievementArray[0]);
    }
    console.log("Beautifying complete!");
    return numericalAchievementArray;
}
function findOBSD_(companyID, sheet) {
    if (sheet === void 0) { sheet = SpreadsheetApp.openById("1m23pHEfPT5byJbKqlmMbIc6ZGDN9mRHHVL6ABWvdRW8").getSheetByName("Training Status by AM"); }
    if (sheet) {
        var r = sheet.getRange("A:A");
        console.log("searching for " + companyID + ".}");
        var rows, values = r.getValues();
        for (var i = 0; i < values.length; i++) {
            if (values[i][0] == companyID) {
                console.log("found " + companyID + " at values[" + i + "][0]");
                rows = i + 1;
                return sheet.getRange(rows, 14).getValue();
            }
        }
        console.log("Company Id " + companyID + " not found.");
        return "";
    }
    else
        throw new Error("The given sheet, " + sheet + ", couldn't be found");
}
/**
* Get the date a given number of days again
* @param since number of days ago
* @returns the date so many days ago
*/
function calculateDaysAgo_(since) {
    var d = new Date();
    d.setDate(d.getDate() - since);
    return d;
}
/**
 * Given a User, loops through each day in the CoursesCompleted[] to see if any match the certification courses, and returns the days where they earned a certification
 * @param user
 * @param certificationCourseIDs optional array to specify additional certification courses other than the MAE. default will be ["PgqK7l17TdE1"]
 * @returns the days a user got certified or an empty array if they have never been certified
 */
function checkIfUserIsCertified_(user, certificationCourseIDs) {
    //Loop through each day in the user's course history and check if that course was achieved that day
    var certificationDays = user.CourseHistory.map(function (daysCourses, dayIndex) {
        //Check if the user get certified on a given day
        if (checkCertificationStatus(daysCourses, certificationCourseIDs).certificationPercent > 0) {
            return dayIndex;
        }
        else
            return -1;
    });
    return (certificationDays);
}
/**
 * Take an array of users with achievements and replace the achievement data with a number.
 * Adds a * if the course was a certification course
 * @param strippedOutNonAchievers
 * @param certificationNoted
 */
function transformDailyAchievementArrayIntoNumericalArray_(strippedOutNonAchievers, certificationNoted) {
    var numericalAchievementArray = strippedOutNonAchievers.map(function (user, userIndex) {
        var numberArray = user.CourseHistory.map(function (day, dayIndex) {
            var count = day.length;
            //certificationNoted[userIndex] is something like [3, 18], signifying achievements were done on days 3 and 18
            if (certificationNoted[userIndex].includes(dayIndex)) {
                return String(count) + "*";
            }
            else
                return String(count);
        });
        return numberArray;
    });
    return numericalAchievementArray;
}
function prepSingleComppanyRowForPosting_(prettyArray, companyTrainingStatus, daysSinceLastAchievement, totalNumberAchievements, totalNumberUsers, totalUserCertifications) {
    var _a;
    var headers = [companyTrainingStatus, (new Date()).toString(), daysSinceLastAchievement.toString(), totalNumberAchievements.toString(), totalNumberUsers.toString(), totalUserCertifications.toString()];
    if (prettyArray[0]) {
        (_a = prettyArray[0]).unshift.apply(_a, headers);
        return prettyArray;
    }
    else
        return [headers];
}
function postAllUsersToSheet_(prettyArray, onboardingStartDate, sheet) {
    //Calculate the range to place onto SpreadSheet
    var rows = prettyArray.length;
    var columns = Math.max.apply(Math, (prettyArray.map(function (day) { return day.length; })));
    console.log("Calculated range for placing on ss: rows: " + rows + ", columns: " + columns + ".");
    //Clear the old data
    console.log('Trying to clear old data off.');
    var oldData = sheet.getDataRange().offset(4, 0).clear({ contentsOnly: true });
    var obst_formatted;
    try {
        obst_formatted = onboardingStartDate.toString().split(" ").slice(1, 4).join(" ");
        console.log("Spliting the date: " + obst_formatted);
    }
    catch (err) {
        console.log("There was an issue formatting the date: " + err);
    }
    try {
        console.log("Attempting to post on the ss");
        var returnDate = function () { if (obst_formatted)
            return obst_formatted;
        else
            return onboardingStartDate; };
        var topOBSD = sheet.getRange(2, 2).setValue(returnDate());
        console.log("Trying to place the data onto the sheet.");
        var r = sheet.getRange(5, 1, rows, columns).setValues(prettyArray);
        console.log("Mission accomplished!");
        return true;
    }
    catch (err) {
        throw new Error(err);
    }
}
function displayRunner() {
    displayCompanyHistoricTrainingResultsOnOnRow_(10);
}
function getCompanyTrainingStatus2_(dataToDisplay, totalNumberAchievements, totalUserCertifications, daysSinceLastAchievment, totalNumUsers) {
    var status;
    if (totalNumUsers == 0) {
        status = "No Users or Logins";
        return status;
    }
    if (totalUserCertifications > 0) {
        status = totalUserCertifications + " certified user/users";
        return status;
    }
    if (daysSinceLastAchievment <= 7 && daysSinceLastAchievment >= 0) {
        status = "In Progress";
        return status;
    }
    else
        return "Stalled";
}
/**
 * This is the fundamental function that takes a SharpSpring company ID and returns the training history for each user.
 * @param companyID SharpSpring company ID
 * @param reportingThreshold? Optional limit for how many days back to show results from.
 */
function getCompanyUserAchievements(companyID, reportingThreshold) {
    //Search Litmos for all users with the corresponding companyID
    console.log("Getting all company users.");
    var allCompanyUsers = getAllCompanyUsers(companyID);
    //Get the training status for each user
    console.log("Getting individual training records from Litmos.");
    var allUserTrainingStatus = getAllUserLitmosAchievements_(allCompanyUsers, reportingThreshold);
    //Correct achievement dates so they're out of Litmos form
    console.log("Fixing training dates");
    var allUserTrainingStatus_properDates = allUserTrainingStatus.map(function (user) {
        user.CoursesCompleted = fixLitmosDates_(user.CoursesCompleted);
        return user;
    });
    return allUserTrainingStatus_properDates;
    // TODO Helper functions
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
}
//# sourceMappingURL=HistoricTrainingData2.js.map