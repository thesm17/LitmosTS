
function getCompanyTrainingStatus (companyID, trainingThreshold) {

  Logger.log("Given companyID: "+companyID);
  if (companyID.toString().charAt(0)=='c') {companyID = parseCompanyIdFromLitmosUsername(companyID);}
    Logger.log("Parsed the company ID from the Litmos Username: "+companyID);  
  Logger.log("Training Threshold: "+trainingThreshold);
  var trainingThresholdDate = convertThresholdToDate(trainingThreshold);
  Logger.log("Training threshold date: "+trainingThresholdDate);
  var users = getCompanyUsers(companyID);
  Logger.log("All users gotten.\n")
  
  var userData = getAllUserData(users);
  Logger.log("All data for all users gotten.\n")
  
  //array of certified users
  var certifiedUsers = userData.filter(function (user) {return user.certificationStatus.certificationComplete} );
  Logger.log("Number of certified users: "+certifiedUsers.length);
  
  //array of users who completed a course in the report threshold range
  var achievementUsers = userData.filter(function (user) {
    Logger.log(user.recentCourseCompletionDate+" :is user recent completion date");
    Logger.log(trainingThresholdDate+" :is training threshold date");
    Logger.log(user.recentCourseCompletionDate>trainingThresholdDate+" :is comparison");
    return (user.recentCourseCompletionDate>trainingThresholdDate);});
  Logger.log("Number of recent achieving users: "+achievementUsers.length);

  //array of people who started training in the report threshold range
  var startedInLastWeekUsers = userData.filter(function (user) {
  //   Logger.log("number of days since creation: "+user.daysSinceCreatedDate)
  //   Logger.log("training threshold: "+trainingThreshold)
  //   Logger.log(+user.daysSinceCreatedDate<+trainingThreshold);
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

function getCompanyUsers (companyID) {
  var companyUserData = getAllCompanyUsers(companyID);
  return companyUserData;
}

function getUserData (username) {

  var userAccountData =  getUser(username.UserName);

  var allAchievements =  getAchievements(username);

  var recentAchievements = getRecentAchievements(allAchievements,7);

  var certified = certificationTestPassed(allAchievements);

  var recentCourseTitle, recentCourseCompletionDate;

  if (recentAchievements[0]) { 
    recentCourseTitle = recentAchievements[0].Title;
    recentCourseCompletionDate = convertLitmosDate(recentAchievements[0].AchievementDate);}
  else {
    recentCourseTitle = "No recent courses completed";
    recentCourseCompletionDate = {}
  }


  return {
    name: userAccountData.FullName,
    certifiedUser: certified.certificationComplete,
    certificationStatus: certified,
    totalCoursesCompleted: allAchievements.length,
    recentCourseTitle: recentCourseTitle,
    recentCourseCompletionDate: recentCourseCompletionDate,
    daysSinceLastLogin:daysSinceLastLogin(userAccountData.LastLogin),
    daysSinceCreatedDate: daysSinceCreatedDate(userAccountData.CreatedDate)
  }
}


function getAchievements (username) {
  
  //GET user achievement data with username and since seven days ago
  var achievements =  getLitmosAchievement(username);
  return achievements
}

function certificationTestPassed  (userAchievements){
  //below are the course IDs that together make up certification
  // PgqK7l17TdE1 is the MA essentials cert exam
  // ax6BzyMrCds1 is the SWS cert exam
  var certExamIds = ["PgqK7l17TdE1"];
  
  if (certExamIds.length==0){
    throw new Error({result:"No courses have been specific for awarding certification."});
  
  }
  var examsPassed = userAchievements.filter(function (courseID) { return certExamIds.includes(courseID.CourseId)});
  return {
    certificationPercent: (examsPassed.length*100/certExamIds.length),
    certificationComplete: Math.floor(examsPassed.length/certExamIds.length),
    examData: {
      examsPassed: examsPassed.map(function (exam) {return exam.Title}),
      completionDates: examsPassed.map(function (exam) {return convertLitmosDate(exam.AchievementDate)})}
  }
}

function getAllUserData (users) {
  var userData = users.map(function (user) {
    var results =  getUserData(user)
    Logger.log(results);
    return results;
  });
  return userData;
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

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

      function sameValueZero(x, y) {
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