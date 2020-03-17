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
    var user: {
      UserName: string, 
      FirstName: string,
      LastName: string,
      FullName: string,
      Email: string,
      LastLogin: string,
      CreatedDate: string,
      others?: string
    } =  JSON.parse(result.getContentText());
    
    return user;
  } catch (err) {
      throw new Error(`There was an erro getting user ${username} from Litmos.`);    
  }
}

function getLitmosAchievements(user: {UserName: string, others?: any}, since?: number) {
  if (since) {
    var url = "https://api.litmos.com/v1.svc/achievements?userid="+user.UserName+"&source=smittysapp&format=json&since="+since;
  }
  else {
    var url = "https://api.litmos.com/v1.svc/achievements?userid="+user.UserName+"&source=smittysapp&format=json";
  } 
  try {
    var result =  UrlFetchApp.fetch(url,options as any);
    var achievements: {
        Title: string,
        AchievementDate: string,
        CourseId: string,
        CompliantTillDate?: string|null
      }[] =  JSON.parse(result.getContentText());

    return achievements;
  } catch (err) {
    throw new Error(`Error getting achievements for ${user.UserName}. Error given: \n${err}`);
    }
  }

function getAllCompanyUsers(companyID: string) {
  
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
   
    try {
      var result =  UrlFetchApp.fetch(url,options as any);
      var users: {
        UserName: string,
        FirstName: string,
        LastName: string,
        FullName: string,
        Email: string,
        others?: any
        
      }[] =  JSON.parse(result.getContentText());
      return users;
    } catch (err) {
      console.log(err)
      throw new Error(`Error while trying to get company users of ${companyID}`)
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