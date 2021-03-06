
function convertLitmosDate (litmosDate: string) {
  var rawDate = litmosDate;
  var convert = rawDate.substr(-7,5);
  var conversionFactor=(+convert*60*600);
  var middleDate = rawDate.substr(6);
  var lateDate = middleDate.split("-")[0];
  var usefulDate = new Date(0);  
  usefulDate.setMilliseconds(+lateDate + +conversionFactor);
return usefulDate;
}

function  millsSince(time1: string|Date, time2: string|Date = new Date()) {
  var dt1 = new Date(time1).getTime();
  var dt2 = new Date(time2).getTime();
  var timeBetween = Math.abs(dt1-dt2)
  return timeBetween;
}

function daysSince(milliseconds: number) {
  return milliseconds/(1000*60*60*24);
}

function daysSinceCreatedDate (createdDate: string) {
  var today = new Date();
  var createDateLog = new Date(createdDate);
  var timeSinceAccountCreate = (+today-+createDateLog);
  var daysSinceAccountCreate = (timeSinceAccountCreate/(1000*60*60*24)).toFixed(2)
  return (daysSinceAccountCreate);
}

function daysSinceLastLogin (lastLogin: string) {
  var today = new Date();
  var lastLog = new Date(lastLogin);
  var timeSinceLastLogin = (+today-+lastLog);
  var daysSinceLastLogin = (timeSinceLastLogin/(1000*60*60*24)).toFixed(2)
  return (daysSinceLastLogin);
}

function convertThresholdToDate (numdays: number)  {
  var d = new Date();
  var ts = d.valueOf();
  var datebefore = ts-( numdays * 1000 * 60 * 60 * 24);
  Logger.log("current date: "+d);
  Logger.log("New date: "+d.setTime(+datebefore));
  Logger.log("d after adjusting: "+d);
  return d;
}

function getRecentAchievements (achievements: {AchievementDate: string, Title:string, others?:any}[],numDays=7)  {
  var recent = achievements.filter(function (achievement){ 
    var today = new Date();
    var achievementDate = convertLitmosDate(achievement.AchievementDate)
    var daysAgo = ((+today-+achievementDate)/(1000*60*60*24)).toFixed(2);
    return (+daysAgo<numDays);
 })
  return recent;
}

function parseCompanyIdFromLitmosUsername (username: string)  {
  return username.split("u")[0].substr(1);
}

/**
 * Converts Date into YYYY-MM-DD format for Litmos
 * @param date 
 * @returns date in YYYY-MM-DD format for Litmos
 */
function formatDate(date: Date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}