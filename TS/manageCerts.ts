var baseUrl = "https://api.litmos.com/v1.svc/";
var options = { 
    'method': 'GET',
    'muteHttpExceptions' : true,
    'headers': {
      'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54' }
  }
const getCompanyUsers = async (companyID: string) => {
  var companyUserData = await getAllCompanyUsers(companyID);
  return companyUserData;
}

const convertLitmosDate = (litmosDate: string) => {
  var rawDate = litmosDate;
  var convert = rawDate.substr(-7,5);
  var conversionFactor=(+convert*60*600);
  var middleDate = rawDate.substr(6);
  var lateDate = middleDate.split("-")[0];
  var usefulDate = new Date(0);  
  usefulDate.setMilliseconds(+lateDate + +conversionFactor);
return usefulDate;
}

const getUserData = async (username: {UserName: string; CourseId: string; Title: string; AchievementDate: string; others?: any; }) => {

  var userAccountData = (await getUser(username.UserName));

  var allAchievements = await getLitmosAchievement(username);

  var recentAchievements = getRecentAchievements(allAchievements,7);

  var certified = await certificationTestPassed(username);

  var recentCourseTitle, recentCourseCompletionDate;

  if (recentAchievements.length>0) { 
    recentCourseTitle = recentAchievements[0].Title;
    recentCourseCompletionDate = convertLitmosDate(recentAchievements[0].AchievementDate);}
  else {
    recentCourseTitle = "No recent courses completed";
    recentCourseCompletionDate = "N/A"
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

const daysSinceCreatedDate = (createdDate: string) => {
  var today = new Date();
  var createDateLog = new Date(createdDate);
  var timeSinceAccountCreate = (+today-+createDateLog);
  var daysSinceAccountCreate = (timeSinceAccountCreate/(1000*60*60*24)).toFixed(2)
  return (daysSinceAccountCreate);
}

const daysSinceLastLogin = (lastLogin: string) => {
  var today = new Date();
  var lastLog = new Date(lastLogin);
  var timeSinceLastLogin = (+today-+lastLog);
  var daysSinceLastLogin = (timeSinceLastLogin/(1000*60*60*24)).toFixed(2)
  return (daysSinceLastLogin);
}

const getRecentAchievements = (achievements: any[], numDays: number) => {
  var recent = achievements.filter(achievement => {
    var today = new Date();
    var achievementDate = convertLitmosDate(achievement.AchievementDate)
    var daysAgo = ((+today-+achievementDate)/(1000*60*60*24)).toFixed(2);
    return (+daysAgo<numDays);
 })
  return recent;
}

const certificationTestPassed = async (userAchievements: { UserName: string; CourseId: string; Title: string | undefined; AchievementDate: string; others?: any; }) => {
  //below are the course IDs that together make up certification
  // PgqK7l17TdE1 is the MA essentials cert exam
  // ax6BzyMrCds1 is the SWS cert exam
  var certExamIds = ["PgqK7l17TdE1"];
  
  if (certExamIds.length==0){
    throw new Error('{result:"No courses have been specific for awarding certification."}');
  
  }
  //GET courses from litmos with [username]
  //will return JSON found above as `data`
  var userAchievementData = [userAchievements];
  var examsPassed = userAchievementData.filter(courseID => (certExamIds.includes(courseID.CourseId)));
  return {
    certificationPercent: (examsPassed.length*100/certExamIds.length),
    certificationComplete: Math.floor(examsPassed.length/certExamIds.length),
    examData: {
      examsPassed: examsPassed.map(exam => exam.Title),
      completionDates: examsPassed.map(exam => convertLitmosDate(exam.AchievementDate))}
  }
}

const getAllUserData = async (users: any[]) => {
  var userData = users.map(async (user) => {
    var results = await getUserData(user)
    console.log(results);
    return results;
  });
  return Promise.all(userData);
}

const convertThresholdToDate = (numdays: number|string) => {
  var d = new Date();
  var datebefore = +d-(+numdays*1000*60*60*24);
  return datebefore;
}

const getCompanyTrainingStatus = async (companyID: string, trainingThreshold: number|string) => {
  var trainingThresholdDate = convertThresholdToDate(trainingThreshold);
  var users = await getCompanyUsers(companyID);
  var userData = await getAllUserData(users);
  
  //array of certified users
  var certifiedUsers = userData.filter(user => user.certificationStatus.certificationComplete);
 
  //array of users who completed a course in the report threshold range
  var achievementUsers = userData.filter(user => {
    return ((+user.recentCourseCompletionDate) >trainingThresholdDate);
    
  });
 
  //array of people who started training in the report threshold range
  var startedInLastWeekUsers = userData.filter(user => user.daysSinceCreatedDate<trainingThreshold);

  //return certified if the certified array is nonempty
    if (certifiedUsers.length>0) {
      return {
        totalLearners: users.length,
        trainingStatus: certifiedUsers.length+" certified users",
        certifiedUsers: certifiedUsers,
        completedCoursesThisWeek: achievementUsers,
        startedThisWeek: startedInLastWeekUsers
        }
    }
  //return in progress if there have been certifications this week or new users created
    else if (achievementUsers.length || startedInLastWeekUsers.length){
    return {
      totalLearners: users.length,
      trainingStatus: "In Progress",
      completedCoursesThisWeek: achievementUsers,
      startedThisWeek: startedInLastWeekUsers
      }
    }
//return stalled if no progress this week
    else if (Array.isArray(users) && users.length) {
      return {
        totalLearners: users.length,
        trainingStatus: "Stalled",
        completedCoursesThisWeek: "",
        startedThisWeek: "",
        users
      }
    }
  //return no logins if there are no users
    else return {
      totalLearners: "0",
      trainingStatus: "No Users or Logins"
    }
  }

const getUser = async (username: string) => {
  var url = baseUrl+"/users/"+username+"?source=smittysapp&format=json";
  var options = { 
    method: 'GET',
    headers: {      
      'apikey': '832c9ac0-b65e-4825-8c72-b53f2b66efd6' 
    }
  }

  try {
    var result = await fetch(url,options);
    var user: {UserName: string, FullName: string, LastLogin: string, CreatedDate: string, others?: any} = await result.json();
    return user;
  } catch (err) {
    console.log(err); 
    throw new Error(err)
  }
}

const getLitmosAchievement = async (username: {UserName: string, others?: any}, since?: string) => {
if (since) {

  var url = "https://api.litmos.com/v1.svc/achievements?userid="+username.UserName+"&source=smittysapp&format=json&since="+since;
  var options = { 
    method: 'GET',
    headers: {      
      'apikey': '832c9ac0-b65e-4825-8c72-b53f2b66efd6' 
    }
  }
}
else {
  var url = "https://api.litmos.com/v1.svc/achievements?userid="+username.UserName+"&source=smittysapp&format=json";
  var options = { 
    method: 'GET',
    headers: {      
      'apikey': '832c9ac0-b65e-4825-8c72-b53f2b66efd6' 
    }
  }
} 
try {
  var result = await fetch(url,options);
  var achievements = await result.json();
  return achievements;
} catch (err) {
  console.log(err); 
  throw new Error(err);
  }

}

const getAllCompanyUsers = async (companyID: string) => {
  
  var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
  var options = { 
    method: 'GET',
    headers: {      
      'apikey': '832c9ac0-b65e-4825-8c72-b53f2b66efd6' 
    }
  }
  
  try {
    var result = await fetch(url,options);
    var users = await result.json();
    return users;
  } catch (err) {
    console.log(err); 
    throw new Error(err)
  } 
}

const companyTrainingStatusGETTest = async (companyID: string) => {
  var trainingReportThreshold = 7 //denotes that 7 days is when to check achievement records
  var results = await getCompanyTrainingStatus(companyID, trainingReportThreshold);
  console.log("\nTraining Results:\n"+JSON.stringify(results));
}

companyTrainingStatusGETTest("308479444");

//has 3 certified users:
//runner("308478809");

const parseUsername = (username: string) => {
  return username.split("u")[0].substr(1);
}
