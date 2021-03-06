"use strict";
/**
 * Gets the agency course certification status for users in a User[].
 * Certifications are defined internally in this function.
 * If speed is an issue and you don't need to check for Spanish cert achievements, you can set englishOnly = true to skip the spanish certification lookups.
 * @param users a User[]
 * @param englishOnly Set `true` to skip looking Spanish certification lookups
 */
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
function getCertificationCourseCompletionStatus_(users, englishOnly) {
    //Define which courses are the proper certification ones
    //English:  
    // Marketing Automation Essentials ID: "PgqK7l17TdE1"
    // Succeeding with SharpSpring for Agencies ID: "0cbs--6jkgw1"
    // Advanced Exam ID: "SC5guv5jtx01"
    //Spanish:
    // Spanish MAE: "8ErJpxT3KKc1"
    // Spanish SWS: "gNHu4th03ss1"
    // Spanish Advances: does not exist
    if (englishOnly === void 0) { englishOnly = false; }
    var englishCertificationCourses = ["PgqK7l17TdE1", "0cbs--6jkgw1", "SC5guv5jtx01"];
    var allCertificationCourses = ["PgqK7l17TdE1", "0cbs--6jkgw1", "SC5guv5jtx01", "8ErJpxT3KKc1", "gNHu4th03ss1"];
    var companyCourseCompletions, nonzeroCompletions;
    //Check either for english certification or for both english and spanish
    if (englishOnly) {
        companyCourseCompletions = getCourseCompletions_(users, englishCertificationCourses);
        nonzeroCompletions = companyCourseCompletions.filter(function (courseData) { return courseData.numberOfCompanyUsersWithCompletions > 0; });
    }
    else {
        //Get each user's achievement record for each certification course. 
        companyCourseCompletions = getCourseCompletions_(users, allCertificationCourses);
        //Filter out empty users
        nonzeroCompletions = companyCourseCompletions.filter(function (courseData) { return courseData.numberOfCompanyUsersWithCompletions > 0; });
        //combine the MAEs together
        nonzeroCompletions = combineTwoCourseResults_(nonzeroCompletions, "PgqK7l17TdE1", "8ErJpxT3KKc1");
        //combine the SWSs together
        nonzeroCompletions = combineTwoCourseResults_(nonzeroCompletions, "0cbs--6jkgw1", "gNHu4th03ss1");
    }
    return nonzeroCompletions;
}
/**
 * Combine the results from an English course and an equivalent Spanish course into one array.
 * @param certificationStats a CourseCompletionResult[]
 * @param courseID1 the main course to collapse the second course into
 * @param courseID2 a secondary course, such as an equivalent course in Spanish
 */
function combineTwoCourseResults_(certificationStats, courseID1, courseID2) {
    var _a;
    try {
        var course1results = certificationStats.find(function (course) { return course.courseID == courseID1; });
        var course1index = certificationStats.findIndex(function (course) { return course.courseID == courseID1; });
        var course2results = certificationStats.find(function (course) { return course.courseID == courseID2; });
        var course2index = certificationStats.findIndex(function (course) { return course.courseID == courseID2; });
        //If they gained an achievment in English
        if (course1results) {
            //and also gained one in Spanish
            if (course2results) {
                //Add the number of users together
                course1results.numberOfCompanyUsersWithCompletions += course2results.numberOfCompanyUsersWithCompletions;
                //Combine all the user's results together
                (_a = course1results.userCourseCompletionData).push.apply(_a, course2results.userCourseCompletionData);
                //Overwrite the english course data with the combined course data
                certificationStats[course1index] = course1results;
            }
            //Only achieved in English
            //Nothing to do here.
        }
        //Only achieved in Spanish
        else if (course2results) {
            //Create a duplicate as if it were in English
            certificationStats.push(course2results);
        }
        return certificationStats;
    }
    catch (err) {
        throw new Error("There was an issue combining the two courses. " + err);
    }
}
/**
 * Given users in a User[] and an array of courseIDs, return the users that have completed them
 * @param users
 * @param courseIDs
 */
function getCourseCompletions_(users, courseIDs) {
    //Loop through each given course
    return courseIDs.map(function (courseID) {
        //Get all the user completions for that course
        var companyCourseCompletions = filterCourseCompletions_(users, courseID);
        return {
            courseID: courseID,
            numberOfCompanyUsersWithCompletions: companyCourseCompletions.length,
            userCourseCompletionData: companyCourseCompletions
        };
    });
    /**
   * Given users in a User[] and a given courseID, return the users who have completions of that specific course
   * @param users
   * @param courseID
   * @returns each user's number of completions and lookup info
   */
    function filterCourseCompletions_(users, courseID) {
        //Loop through each user
        return users.map(function (user) {
            //Count how many times that user completed this course
            var thisUserCompletions = countUserCourseCompletions_(user, courseID);
            //Return the Email and UserName for later lookup
            return {
                Email: user.Email,
                UserName: user.UserName,
                numberOfTimesUserCompletedThisCourse: thisUserCompletions.numberOfCompletions,
                completionDates: thisUserCompletions.completionDates
            };
        }).filter(function (user) { return user.numberOfTimesUserCompletedThisCourse > 0; });
        /**
       * Given a user and a course ID, return the number of completions and the dates they were achieved.
       * @param user a User object
       * @param courseID Litmos course ID
       * @returns the numbers of completions and the dates they were achieved.
       */
        function countUserCourseCompletions_(user, courseID) {
            //Filter out only the achievements you want
            var thisCourseAchievements = user.CoursesCompleted.filter(function (course) {
                return course.CourseId == courseID;
            });
            //Count the number of completions
            var numberOfCompletions = thisCourseAchievements.length;
            //Collapse the completions dates into one array for returning
            var completionDates = thisCourseAchievements.map(function (course) {
                return course.AchievementDate;
            });
            return {
                numberOfCompletions: numberOfCompletions,
                completionDates: completionDates
            };
        }
    }
}
function getAgencyCertificationExamResults(companyID) {
    //1. Get users for the company
    console.log("Getting user achievements.");
    var userAchievements = getCompanyUserAchievements(companyID);
    //2. Get certification stats
    console.log("Begin parsing for MAE, SWS and advanced exams.");
    var certificationStats = getCertificationCourseCompletionStatus_(userAchievements);
    //3. Format MAE, SWS and ADV for posting onto sheet
    var arrangedCerts = arrangeCertificationExamResultsForSheet(certificationStats);
    return arrangedCerts;
}
/**
 * Arrange the first two MAEs and dates, first two SWSs and dates, and first two ADVs and dates so it can be posted.
 * @param certificationStats CourseCompletionResult[]
 */
function arrangeCertificationExamResultsForSheet(certificationStats) {
    //Search for if there's an index of
    var MAEIndex = certificationStats.findIndex(function (cert) { return cert.courseID == "PgqK7l17TdE1"; });
    var MAEResults = getFirstTwoEmailsAndCompletionDatesFromAchievements(certificationStats[MAEIndex]);
    var SWSIndex = certificationStats.findIndex(function (cert) { return cert.courseID == "0cbs--6jkgw1"; });
    var SWSResults = getFirstTwoEmailsAndCompletionDatesFromAchievements(certificationStats[SWSIndex]);
    var ADVIndex = certificationStats.findIndex(function (cert) { return cert.courseID == "SC5guv5jtx01"; });
    var ADVResults = getFirstTwoEmailsAndCompletionDatesFromAchievements(certificationStats[ADVIndex]);
    return __spreadArrays(MAEResults, SWSResults, ADVResults);
    // TODO Helper functions
    function getFirstTwoEmailsAndCompletionDatesFromAchievements(certificationStat) {
        var preppedArray = ["", "", "", ""];
        //If they didn't complete any
        if (!certificationStat)
            return preppedArray;
        else {
            //Fill in preppedArray with as many as they have achievements, then only take the first 4 cells
            certificationStat.userCourseCompletionData.forEach(function (user, index) {
                preppedArray[index] = user.Email;
                preppedArray[index + 1] = user.completionDates[0];
            });
            return preppedArray.slice(0, 4);
        }
    }
}
function certRunner() {
    var certificationResults = getAgencyCertificationExamResults("308480190");
    //console.log(results);
}
//# sourceMappingURL=CalculateCompanyCertifications.js.map