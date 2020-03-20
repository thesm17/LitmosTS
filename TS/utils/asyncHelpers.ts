
function getCompanyTrainingStatus (companyID: string, trainingThreshold: number = 7) {

  Logger.log("Given companyID: "+companyID);
  if (companyID.toString().charAt(0)=='c') {companyID = parseCompanyIdFromLitmosUsername(companyID);}
  Logger.log("Parsed the company ID from the Litmos Username: "+companyID);  
  Logger.log("Training Threshold: "+trainingThreshold);
  
  var trainingThresholdDate = convertThresholdToDate(trainingThreshold);
  Logger.log("Training threshold date: "+trainingThresholdDate);

  var users = getAllCompanyUsers(companyID);
  Logger.log("All users gotten.\n")
  
  //Proceed if the company has some number of learners in Litmos
  if (users) {
    var userData = getAllUserData(users);
    Logger.log("All data for all users gotten.\n")
    
    //pass individual training data to SharpSpring lead records
    var shspSuccess = updateShSpTrainingStatus(userData);

    //array of certified users
    var certifiedUsers = userData.filter(function (user: {certificationStatus: any, others?: any}) {return user.certificationStatus.certificationComplete} );
    Logger.log("Number of certified users: "+certifiedUsers.length);
    
    //array of users who completed a course in the report threshold range
    var achievementUsers = userData.filter(function (user: {recentCourseCompletionDate: any, others?: any}) {
      Logger.log(user.recentCourseCompletionDate+" :is user recent completion date");
      Logger.log(trainingThresholdDate+" :is training threshold date");
      Logger.log(user.recentCourseCompletionDate>trainingThresholdDate+" :is comparison");
      return (user.recentCourseCompletionDate>trainingThresholdDate);});
    Logger.log("Number of recent achieving users: "+achievementUsers.length);

    //array of people who started training in the report threshold range
    var startedInLastWeekUsers = userData.filter(function (user: {daysSinceCreatedDate: any, others?: any}) {
      return (+user.daysSinceCreatedDate<=+trainingThreshold)});
    Logger.log("Number of recently created users: "+startedInLastWeekUsers.length);

    //return certified if the certified array is nonempty
      if (certifiedUsers.length>0) {
        return {
          totalLearners: users.length,
          trainingStatus: certifiedUsers.length+" certified user/users",
          certifiedUsers: certifiedUsers,
          completedCoursesThisWeek: achievementUsers,
          startedThisWeek: startedInLastWeekUsers
          }
      }
    //return in progress if there have been certifications this week or new users created
    else if (achievementUsers.length || startedInLastWeekUsers.length){
        Logger.log("Training in progress\n");
      return {
        totalLearners: users.length,
        trainingStatus: "In Progress",
        certifiedUsers: {},
        completedCoursesThisWeek: achievementUsers,
        startedThisWeek: startedInLastWeekUsers
        }
      }
  //return stalled if no progress this week
      else if (Array.isArray(users) && users.length) {
        Logger.log("Training stalled.\n");
        return {
          totalLearners: users.length,
          trainingStatus: "Stalled",
          certifiedUsers: {},
          completedCoursesThisWeek: {},
          startedThisWeek: {}
        }
      }
    }
  
  //return no logins if there are no users
  else {
    Logger.log("No logins for this company.\n");
    return {
      totalLearners: "0",
      trainingStatus: "No Users or Logins",
      certifiedUsers: {},
      completedCoursesThisWeek: "",
      startedThisWeek: ""
    }}
  }

function getUserData (user: {UserName: string, others?: any}) {
  
  var recentCourseTitle, recentCourseCompletionDate;

  //Get user account data from Litmos
  var userAccountData =  getUser(user.UserName);
  
  //Get all user achievements
  var allAchievements =  getLitmosAchievements(user);
  
  //Check if the user is certified
  var certified = checkCertificationStatus(allAchievements);


  //Check whether any of the completions are recent
  var recentCourseTitle, recentCourseCompletionDate;
  var recentAchievements = getRecentAchievements(allAchievements,7);
  //If there is a recent achievement, store the title and achievement date
  if (recentAchievements[0]) { 
    recentCourseTitle = recentAchievements[0].Title;
    recentCourseCompletionDate = convertLitmosDate(recentAchievements[0].AchievementDate);
  }else {
  //Otherwise return no new courses  
    recentCourseTitle = "No recent courses completed";
    recentCourseCompletionDate = ""
  }

  //Return given user information
  return {
    name: userAccountData.FullName,
    email: userAccountData.Email,
    certifiedUser: certified.certificationComplete,
    certificationStatus: certified,
    totalCoursesCompleted: allAchievements.length,
    recentCourseTitle: recentCourseTitle,
    recentCourseCompletionDate: recentCourseCompletionDate,
    daysSinceLastLogin:daysSinceLastLogin(userAccountData.LastLogin),
    daysSinceCreatedDate: daysSinceCreatedDate(userAccountData.CreatedDate)
  }
}

/**
 * Check if any of the given Achievements[] are defined as certification achievements
 * @param userAchievements An Achievements[]
 * @param certificationExamsIDs Pass in optional courseIDs[] using Litmos courseIDs. The default param checks for the courseID for the MAE essentials exam, ["PgqK7l17TdE1"]
 * !could be easily changed to search for any given course completion using the optional parameter!
 */

function checkCertificationStatus  (userAchievements: Achievement[], certificationExamsIDs = ["PgqK7l17TdE1"]){
  //below are the course IDs that together make up certification
  // PgqK7l17TdE1 is the MA essentials cert exam
  // ax6BzyMrCds1 is the SWS cert exam
 
  
  var examsPassed = userAchievements.filter(function (achievement) { 
    if (achievement) {
      return certificationExamsIDs.includes(achievement.CourseId);
    }
     else {return false}
    });
  return {
    certificationPercent: (examsPassed.length*100/certificationExamsIDs.length),
    certificationComplete: Math.floor(examsPassed.length/certificationExamsIDs.length),
    examData: {
      examsPassed: examsPassed.map(function (exam) {return exam.Title}),
      completionDates: examsPassed.map(function (exam) {return convertLitmosDate(exam.AchievementDate)})}
  }
}

/**
 * Given any Litmos achievement, checks if it was a certifiction exam (defined here, internally). Returns 1 for MAE exam, 2 for Advanced exam, or 0 otherwise
 * @param achievement Any Litmos achievement
 * @returns 1 if the achievement is for the MAE exam, 
 * @returns 2 for the advanced exam
 * @return 0 for every other achievement
 */
function checkAchievementType(achievement: Achievement_Webhook) {
  
  //The certification exams are defined here, but these could be changed if the exams change
  var UserCertificationCourseID= "PgqK7l17TdE1", AdvancedCertificationCourseID= "SC5guv5jtx01";

  if (achievement.courseId == UserCertificationCourseID) return 1;
  if (achievement.courseId == AdvancedCertificationCourseID) return 2;
  else return 0;  
}

function getAllUserData (users: any[]) {
  var userData = users.map(function (user: any) {
    var results =  getUserData(user)
    Logger.log(results);
    return results;
  });
  return userData;
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement: any, fromIndex: number) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x: number, y: number) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1. 
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}