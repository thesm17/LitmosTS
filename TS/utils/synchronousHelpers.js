function convertLitmosDate (litmosDate) {
  var rawDate = litmosDate;
  var convert = rawDate.substr(-7,5);
  var conversionFactor=(convert*60*600);
  var middleDate = rawDate.substr(6);
  var lateDate = middleDate.split("-")[0];
  var usefulDate = new Date(0);  
  usefulDate.setMilliseconds(+lateDate + +conversionFactor);
return usefulDate;
}

function daysSinceCreatedDate (createdDate) {
  var today = new Date();
  var createDateLog = new Date(createdDate);
  var timeSinceAccountCreate = (today-createDateLog);
  var daysSinceAccountCreate = (timeSinceAccountCreate/(1000*60*60*24)).toFixed(2)
  return (daysSinceAccountCreate);
}

function daysSinceLastLogin (lastLogin) {
  var today = new Date();
  var lastLog = new Date(lastLogin);
  var timeSinceLastLogin = (today-lastLog);
  var daysSinceLastLogin = (timeSinceLastLogin/(1000*60*60*24)).toFixed(2)
  return (daysSinceLastLogin);
}

function convertThresholdToDate (numdays)  {
  var d = new Date();
  var ts = d.valueOf();
  var datebefore = ts-( numdays * 1000 * 60 * 60 * 24);
  Logger.log("current date: "+d);
  Logger.log("New date: "+d.setTime(+datebefore));
  Logger.log("d after adjusting: "+d);
  return d;
}

function getRecentAchievements (achievements, numDays)  {
  var recent = achievements.filter(function (achievement){ 
    var today = new Date();
    var achievementDate = convertLitmosDate(achievement.AchievementDate)
    var daysAgo = ((today-achievementDate)/(1000*60*60*24)).toFixed(2);
    return (daysAgo<numDays);
 })
  return recent;
}

function parseUsername (username)  {
  return username.split("u")[0].substr(1);
}

function parseCompanyIdFromLitmosUsername (username)  {
  return username.split("u")[0].substr(1);
}