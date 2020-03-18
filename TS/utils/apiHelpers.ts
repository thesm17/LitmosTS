interface PreppedURL {
  responseType: string;
  request: {
      method: any;
      muteHttpExceptions: boolean;
      url: string;
      headers: {
          apikey: string;
      };
  };
}

interface User {
  UserName: string, 
  FirstName: string,
  LastName: string,
  FullName?: string,
  Email: string,
  LastLogin?: string,
  CreatedDate?: string,
  [key:string]:any,
  CoursesCompleted: Achievement[]
}

interface Achievement {
  //Store the username inside the achievement
  UserWhoAchieved: string,
  Title: string,
  AchievementDate: string,
  CourseId: string,
  CompliantTillDate?: string|null,
  //How many days into Onboarding were they when they completed this?
  DaysIntoOnboardingWhenCompleted?: number,
  [key:string]:any
}

/**
 * The following functions: (getUser, getLitmosAchievement, getAllCompanyUsers) are via the Litmos API
 */

var baseUrl = "https://api.litmos.com/v1.svc/";
var options = { 
    'method': 'GET',
    'muteHttpExceptions' : true,
    'headers': {
      'apikey': '4577fd81-69cd-4d49-bccb-03282a1a09f8' }
  }

/**
 * This function is unique from getAllCompanyUsers because it is the only one that can return LastLogin and CreatedDate
 * @param username Litmos username formatted as cXXXXuXXXXe
 * @return user object including LastLogin and CreatedDate
 */
function getUser(username: string) {
  var url = baseUrl+"/users/"+username+"?source=smittysapp&format=json";
  try {
    var result = UrlFetchApp.fetch(url,options as any);
    var user: User =  JSON.parse(result.getContentText());
    
    return user;
  } catch (err) {
      throw new Error(`There was an erro getting user ${username} from Litmos.`);    
  }
}

/**
 * For mapping all Users through so then you can UrlFetchApp.fetchAll() to speed things along.
 * @param user User object
 * @param since string that follows the YYYY-MM-DD pattern to serve as an end of getting achievements
 */

function prepGetLitmosAchievements(user: User, since?:string) {
  var url;
  if (since) {
    url = "https://api.litmos.com/v1.svc/achievements?userid="+user.UserName+"&source=smittysapp&format=json&since="+since;
  }
  else {
    url = "https://api.litmos.com/v1.svc/achievements?userid="+user.UserName+"&source=smittysapp&format=json";
  } 
  var prepped = {
    responseType: "Achievement[]", 
    request: {
     'method': 'GET',
     'muteHttpExceptions' : true,
     'url': `${url}`,
     'headers': {
      'apikey': '4577fd81-69cd-4d49-bccb-03282a1a09f8',      
    }}};
  return prepped;
}

/**
 * Gets achievements for a user with a Litmos username (eg cXXXXuXXXXe). The @param since accepts dates formed as YYYY-MM-DD to serve as an endpoint for searching for achievements
 * @param user Litmos username
 * @param since string that follows the YYYY-MM-DD pattern to serve as an end of getting achievements
 */
function getAllUserLitmosAchievements_(users:User[], since?: string) {
  //Check if the number of individual learners is over 50 (due to Litmos' 100-call per minute limit).
  //If so, slice it so we only get the first 50 users' results.
  if (users.length>50) users.length = 50

  //Get the api calls prepped to get all achievements in bulk  
  var userAchievementGETurls = users.map(user => prepGetLitmosAchievements(user, since));

  //Bulk get all achievements for all users
  var achievements = getAnyLitmos(userAchievementGETurls);
  
  //Set the corresponding user to their proper Achievement[]
  //user[0] will get the Achievement[] corresponding to achievements[0]
  users.forEach(function(user,index){
    var completedCourses = achievements[index] as Achievement[]
    user.CoursesCompleted = completedCourses
  })

  //Return the array of users with a full CoursesCompleted[]
  return users;
  }

  function prepGetAllCompanyUsers(companyID: string) {  
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
    var prepped = {
      responseType: "User[]", 
      request: {
       'method': 'GET',
       'muteHttpExceptions' : true,
       'url': `${url}`,
       'headers': {
        'apikey': '4577fd81-69cd-4d49-bccb-03282a1a09f8',      
      }}};
    return prepped;
  }

  function getAllCompanyUsers(companyID: string) {
  
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
   
    try {
      var result =  UrlFetchApp.fetch(url,options as any);
      var users: User[] =  JSON.parse(result.getContentText());
      return users;
    } catch (err) {
      console.log(err)
      throw new Error(`Error while trying to get company users of ${companyID}`)
    } 
  }

function getAnyLitmos(preppedUrls: PreppedURL[]) {
  try {
    var urls = preppedUrls.map(url => (url.request))
    var results =  UrlFetchApp.fetchAll(urls);
    var container = results.map(function(result,index) {
      switch(preppedUrls[index].responseType){
        case "Achievement[]": {
          var achievements: Achievement[] =  JSON.parse(result.getContentText());
          return achievements;
        }
        case "User[]": {
          var users: User[] =  JSON.parse(result.getContentText());
          return users;
        }
        default: {
          throw new Error(`Improper responseType. Must be either Achievement[] or User[], but was ${preppedUrls[index].responseType}`);
        } 
      }
    })
    return container;
    

  } catch (err) {
    throw new Error(`Error getting achievements for the given url array. Error given: \n${err}`);
    }
}




  /**
 * accountID and secretKey will be stored in UserProperties and retrieved here
 */
var keys = getKeys_()
var accountID = keys.accountID;
var secretKey = keys.secretKey ;
var shspBaseUrl = "https://api.sharpspring.com/pubapi/v1/?";
var newurl = shspBaseUrl+"accountID="+accountID+"&secretKey="+secretKey;
var id = "2100";


var shspOptions = { 
    'method': 'POST',
    'muteHttpExceptions' : true,
    'contentType': 'application/json', 
    'payload': {}    
  }

/**
 * !borked - doesn't accept any args
 */  
function getSharpSpringLead () {
  var method =  "getLeads";
  var params =  {
    'where':{
      'emailAddress': "smitty@sharpspring.com"}
    
  }  
  var payload=  {
    'method': method,
    'params' : params,
    'id': id
  }
  shspOptions.payload = JSON.stringify(payload);
  var result = UrlFetchApp.fetch(newurl,shspOptions as any);
  var lead =  (result.getContentText());
  return lead;
}

function updateSharpSpringLeads (leadsArray: {emailAddress: string, others?: any}[]) {
  var method =  "updateLeads";
  var params =  {
    'objects':leadsArray 
  }  
  var payload=  {
    'method': method,
    'params' : params,
    'id': id
  }
  shspOptions.payload = JSON.stringify(payload);
  var result = UrlFetchApp.fetch(newurl,shspOptions as any);
  var lead =  (result.getContentText());
  return lead;
}



function getKeys_() {
  var userProperties = PropertiesService.getUserProperties();
  return {accountID: userProperties.getProperty('accountID'), secretKey: userProperties.getProperty('secretKey')}
}