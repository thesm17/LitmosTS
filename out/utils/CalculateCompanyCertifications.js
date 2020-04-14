"use strict";
/**
 * Gets the agency course certification status for users in a User[].
 * Certifications are defined internally in this function.
 * If speed is an issue and you don't need to check for Spanish cert achievements, you can set englishOnly = true to skip the spanish certification lookups.
 * @param users a User[]
 * @param englishOnly Set `true` to skip looking Spanish certification lookups
 */
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
    var companyCourseCompletions;
    //Check either for english certification or for both english and spanish
    if (englishOnly)
        companyCourseCompletions = getCourseCompletions_(users, englishCertificationCourses);
    else {
        companyCourseCompletions = (getCourseCompletions_(users, allCertificationCourses));
        //! debut this before putting it into production
        //companyCourseCompletions = makeSpanishExamsEquivilent_(companyCourseCompletions);
    }
    return companyCourseCompletions;
}
function makeSpanishExamsEquivilent_(certificationStats) {
    // Check if there are values for the Spanish MAE and Spanish SWS. 
    // If there are, pretend like they're also for the English MAE and English SWS     
    var blankCourseCompletionResult = {
        courseID: "",
        numberOfCompanyUsersWithCompletions: 0,
        userCourseCompletionData: [{
                Email: "",
                UserName: "",
                numberOfTimesUserCompletedThisCourse: 0,
                completionDates: []
            }]
    };
    var englishMAE = certificationStats.find(function (course) { return course.courseID == "PgqK7l17TdE1"; }) || blankCourseCompletionResult;
    var englishSWS = certificationStats.find(function (course) { return course.courseID == "0cbs--6jkgw1"; }) || blankCourseCompletionResult;
    var spanishMAE = certificationStats.find(function (course) { return course.courseID == "8ErJpxT3KKc1"; }) || blankCourseCompletionResult;
    var spanishSWS = certificationStats.find(function (course) { return course.courseID == "gNHu4th03ss1"; }) || blankCourseCompletionResult;
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
        });
        /**
       * Given a user and a course ID, return the number of completions and the dates they were achieved.
       * @param user a User object
       * @param courseID Litmos course ID
       * @returns the numbers of completions and the dates they were achieved.
       */
        function countUserCourseCompletions_(user, courseID) {
            //Filter out only the achievements you want
            var thisCourseAchievements = user.CoursesCompleted.filter(function (course) {
                return course.CourseId = courseID;
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
    var userAchievements = getCompanyUserAchievements(companyID);
    //2. Get certification stats
    var certificationStats = getCertificationCourseCompletionStatus_(userAchievements);
}
function certRunner() {
    var results = getAgencyCertificationExamResults("308462255");
    console.log(results);
}
//# sourceMappingURL=CalculateCompanyCertifications.js.map