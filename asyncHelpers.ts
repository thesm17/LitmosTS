function getUserAchievements (username: string) {
  var allAchievements =  getLitmosAchievements(username);
  return allAchievements;
  }

var baseUrl = "https://api.litmos.com/v1.svc/";
var options = { 
    'method': 'GET',
    'muteHttpExceptions' : true,
    'headers': {
      'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54' }
  }

function getUser(username:string ) {
  var url = baseUrl+"/users/"+username+"?source=smittysapp&format=json";
  try {
    var result = UrlFetchApp.fetch(url,<any>options);
    var user =  JSON.parse(result.getContentText());
    
    return user;
  } catch (err) {
    Logger.log(err); 
  }
}

function getLitmosAchievements(username: string) {
  var url = "https://api.litmos.com/v1.svc/achievements?userid="+username+"&source=smittysapp&format=json";
    var result =  UrlFetchApp.fetch(url,<any>options);
    var achievements: [{CourseId: string, others?: any}] =  JSON.parse(result.getContentText());
    var achievementCourseIds = achievements.map(achievement => {return achievement.CourseId})
    return achievementCourseIds;
  }

function getAllCompanyUsers(companyID: string) {
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
    var result =  UrlFetchApp.fetch(url,<any>options);
    var users: [{Id: string, UserName: string, FirstName:string, LastName:string, others?: any}] =  JSON.parse(result.getContentText());
    if (users) return users; else return null;
  }

function getCourseUsers (courseID: string) {
  var url = `https://api.litmos.com/v1.svc/courses/${courseID}/users?source=smittysapp&format=json`;
   
    try {
      var result =  UrlFetchApp.fetch(url,<any>options);
      var users =  JSON.parse(result.getContentText());
      return users;
    } catch (err) {
      Logger.log(err)
    } 
}
