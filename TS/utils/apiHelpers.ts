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

function getUser(username) {
  var url = baseUrl+"/users/"+username+"?source=smittysapp&format=json";
  try {
    var result = UrlFetchApp.fetch(url,options);
    var user =  JSON.parse(result.getContentText());
    
    return user;
  } catch (err) {
    Logger.log(err); 
  }
}

function getLitmosAchievement(username, since) {
  if (since) {
    var url = "https://api.litmos.com/v1.svc/achievements?userid="+username.UserName+"&source=smittysapp&format=json&since="+since;
  }
  else {
    var url = "https://api.litmos.com/v1.svc/achievements?userid="+username.UserName+"&source=smittysapp&format=json";
  } 
  try {
    var result =  UrlFetchApp.fetch(url,options);
    var achievements =  JSON.parse(result.getContentText());
    return achievements;
  } catch (err) {
    Logger.log(err);
    }
  }

function getAllCompanyUsers(companyID) {
  
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
   
    try {
      var result =  UrlFetchApp.fetch(url,options);
      var users =  JSON.parse(result.getContentText());
      return users;
    } catch (err) {
      Logger.log(err)
    } 
  }

/**
 * The following functions: (getSharpSpringLead, updateSharpSpringLeads)
 */


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
  var result = UrlFetchApp.fetch(newurl,shspOptions);
  var lead =  (result.getContentText());
  return lead;
}

function updateSharpSpringLeads (leadsArray) {
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
  var result = UrlFetchApp.fetch(newurl,shspOptions);
  var lead =  (result.getContentText());
  return lead;
}



function getKeys_() {
  userProperties = PropertiesService.getUserProperties();
  return {accountID: userProperties.getProperty('accountID'), secretKey: userProperties.getProperty('secretKey')}
}