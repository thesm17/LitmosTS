const fetch = require('node-fetch');
var baseUrl = "https://api.litmos.com/v1.svc/";
var options = { 
    'method': 'GET',
    'muteHttpExceptions' : true,
    'headers': {
      'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54' }
  }

async function fetcher(url: string, options: any) {
  //Check whether to use UrlFetchApp or plain old fetch, based on whether being run from node of from clasp
  //if UrlFetchApp is undefined, use fetch()
  if (typeof UrlFetchApp == "undefined") {
    console.log("UrlFetchApp is undefined, so attempting to process via plain fetch()");
    try { 
      var response;
      response = await fetch(url, options);
      return await response.json();
    } catch (e) {
      throw new Error(e)
    }
  } else {
    //UrlFetchApp is defined, so it is for fetching
    try {
      console.log("Using UrlFetchApp for HTTP function.");
      
      var result =  UrlFetchApp.fetch(url,<any>options);
      return JSON.parse(result.getContentText());

    } catch (e) {
      throw new Error(e);
    }
  }
}

/**
 * @param username Litmos username following cXXXXuXXXXe pattern
 * @return 
 */

async function getUser2(username:string ) {
  var url = baseUrl+"/users/"+username+"?source=smittysapp&format=json";
  try {
    
    var user =  await fetcher(url,<any>options);
    
    return user;
  } catch (err) {
    Logger.log(err); 
  }
}

  async function getAllCompanyUsers2(companyID: string) {
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c"+companyID+"u";
    var users: [{Id: string, UserName: string, FirstName:string, LastName:string, others?: any}] =  await fetcher(url,<any>options);
    if (users) return users; else return null;
  }

  async function getCourseUsers (courseID: string) {
  var url = `https://api.litmos.com/v1.svc/courses/${courseID}/users?source=smittysapp&format=json`;
   
    try {
      var users =  fetcher(url,<any>options);
      return users;
    } catch (err) {
      Logger.log(err) 
    } 
}

