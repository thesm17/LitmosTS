var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
/** 
 * Catches webhooks posted by Litmos
 * @param {Object} e -    An individual achievement being sent from litmos
 * @return {TextOutput} A stringified version of the payload 
 */
  function doPost(e: any) {
    var payload = JSON.parse(e.postData.contents).data
    var keys = Object.keys(payload);

    /** User for testing
     *   var values = keys.map((key) => {return payload[key]});
     *   var userID = payload.userId;
     *   var paramsObject = getJsonFromParams(payload)
     * 
     */
 
    var results: string = `Incoming data: ${JSON.stringify(payload)}\n`
    results += runner(payload);
    console.log(results);

    // also for testing
    try {
      var webHookTesterurl= "https://webhook.site/#!/53dc1d7f-2dc4-4f8c-a7b2-377fb6849011";
      var options = {
      'method' : 'POST',
      'contentType': 'application/json', 
      // Convert the JavaScript object to a JSON string.
      //'payload' : `Keys: ${keys}\nValues: ${values}`
      'payload': results
      };
      
      var webhookResponse = UrlFetchApp.fetch(webHookTesterurl,<any> options);
      console.log(webhookResponse);
    } catch (e) {
      console.log("There was some kind of error posting to the webhook testing site.")
    }
    

    //return results to poster
    return ContentService.createTextOutput(results);
  }

function doGet(e: any) {
  if (e.parameter.username) {
    var companyID: string = parseCompanyIdFromLitmosUsername(e.parameter.username)
    var trainingResults = getCompanyTrainingRecordFromSheet(companyID);
    console.log(companyID+", "+ JSON.stringify(trainingResults));
    if (trainingResults){
      var results = {
        usernameInput: e.parameter.username,
        trainingData: (trainingResults)
      }
      return HtmlService.createHtmlOutput(JSON.stringify(results));
    }
  }
  else return HtmlService.createHtmlOutput("No username parameter given.");
}


function parseCompanyIdFromLitmosUsername (username: string)  {
  return username.split("u")[0].substr(1);
}

/**
* Parse SharpSpring companyID and course ID from payload
* @param {Object} payload - The payload from Litmos
* @return {Object} {companyID, courseID} from the achievement
*/
function getCompanyIDAndCourseID (payload:{userName: string, courseId: string, others?: any}) {
  var companyID = parseCompanyIdFromLitmosUsername(payload.userName);
  var data = {
    companyID: companyID,
    courseID: payload.courseId
  }
  return data;
}

/**
 * Search active spreadsheet for the matching companyID row. If one doesn't exist, create it at the bottom. Return the cell where the company ID is located. If the sheet doesn't exist, return null
 * @param {String} companyID SharpSpring company ID.
 * @return {Object {number} } {row, column} where the company ID exists.
 */

 function getCompanyIDCellFromSS (companyID: string) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  //Look for the Company ID header from the first row and set it as the column we're looking for
  var companyIDColumn=1;
  var lastRow = sheet.getLastRow();
  //var companyIDColumn = sheet.getRange("1:1").createTextFinder("Company ID").findNext()?.getColumn() || 1;
  Logger.log(`${columnToLetter(companyIDColumn)}1:${columnToLetter(companyIDColumn)}${lastRow}`);
  var r = sheet.getRange(`${columnToLetter(companyIDColumn)}1:${columnToLetter(companyIDColumn)}${lastRow}`);
  Logger.log("Lookup range for company IDs: "+r.getValues());

  //search range r (which is just a single column) for the given company ID. If it doesn't exist, return the first empty row
  var textFinder = r.createTextFinder(companyID);
  var firstOccurance = textFinder.findNext();

  var row:number;
  //returns null if it isn't in the sheet
  if (firstOccurance!==null) {row = firstOccurance.getRow()} else row = sheet.getLastRow()+1;
Logger.log(`Row: ${row}`);
  //Set a blank cell to the company ID or re-write the company value over itself
  var companyIDCell = sheet.getRange(row,companyIDColumn).setValue(companyID);

  //Log result
  Logger.log(`Company ID ${companyID} is located at ${companyIDCell.getRow()}, ${companyIDCell.getColumn()} (row, col)`);
  return {row: companyIDCell.getRow(), column: companyIDColumn};
 }

/**
 * Find how many of this achievement a given company has
 * @param {string} courseID Litmos course ID from achievement record
 * @param {{row,column}} companyIDCell {row, column} of company ID
 * @return  {{achievementCol: number, numAchievements: number}} 
  * {
  *   column: column where the matching achievement exists (or first empty column),
  *   priorNumberOfAchievements:  corresponding # of completions 
  * }
 */

/**
 * 
 * @param {number} row a given row
 * @return {number} column is the last filled column in a given row
 */
function getLastColumnInRow (row: number) {
  var col:number = 1;
  while (sheet.getRange(row,col).isBlank()==false) {col++}
  return col-1;
}

function getNumberOfAchievments(courseID: string, companyIDCell: {row:number, column:number}){
  
  //Search for column for this courseID

  //count how many filled rows there are
  var lastColumn = getLastColumnInRow(companyIDCell.row);
  Logger.log(`Last column: ${lastColumn}`);
  //define the search range up to the last nonempty cell
  var r = sheet.getRange(companyIDCell.row, 1,1,lastColumn)

  var textFinder = r.createTextFinder(courseID);
  var firstOccurance = textFinder.findNext();

  var col:number, numberOfPriorCompletions: number;
  
  //returns null if it isn't in the sheet 
  if (firstOccurance!==null) {
    col = firstOccurance.getColumn()
  } else {col = lastColumn+1};


  sheet.getRange(companyIDCell.row,col+1)
  Logger.log(`Prior completions would be located at ${companyIDCell.row} ,${col+1}`)
 
    if (sheet.getRange(companyIDCell.row,col+1).isBlank()) {
    numberOfPriorCompletions = 0
  } else {
    numberOfPriorCompletions = sheet.getRange(companyIDCell.row,col+1).getValue();
  }

  Logger.log(`Number of completions: ${numberOfPriorCompletions}`);
    return  {
      achievementCol: col,
      numberOfPriorCompletions: numberOfPriorCompletions
    } 
  }


/**
 * Iterate achievements
 * @param {number} priorNumberOfAchievements
 * @param {number=} interator - number to increase by
 * @return {number} return sum of numberOfAchievements + interator
 */
  function iterateAchievements(priorNumberOfAchievements: number, iterator: number) {
    return (priorNumberOfAchievements+iterator);
  }

 /**
  * Post new achievement number to spreadsheet
  * @param {{number,number}} companyIDCell
  * @param {number} achievementColumn
  * @param {string} courseID 
  * @param {number} numberOfAchievements
  * @return {} getRange(row, column, 1,2).setValues([courseID, numberOfAchievements+1]) 
  */

function updateCompanyAchievementCell(companyIDCell: {row:number}, achievementColumn:number , courseID:any, numberOfAchievements:number ){
  var achData = [courseID, numberOfAchievements]

  var r = sheet.getRange(companyIDCell.row,achievementColumn,1,2);
  Logger.log(r);
  Logger.log(r.getValues())
  Logger.log("Made it to the troublesome bit...");
  var results = r.setValues([achData]);
  Logger.log("Updated values: "+results.getValues);
}

/**
 * 
 * @param {number} payload comes from webhook
 * @return {void}
 * 
 */
function runner(payload:any ) {
  var prepResults: string = "";
  prepResults+="\npayload gotten!";
  //Parse companyID and courseID from webhook
  var {companyID, courseID} = getCompanyIDAndCourseID(payload);

  Logger.log(companyID+"\n"+courseID);
  //Get the cell in the spreadsheet where the companyID is located. If it hasn't existed before, add it to the companyID column at the bottom-most row.
  var companyIDCell = getCompanyIDCellFromSS(companyID);

  //Grab that company's achievement record for the given courseId. If There aren't any, return zero
  var achievementData = getNumberOfAchievments(courseID, companyIDCell);
  prepResults += `\nAchievement Data: \n${achievementData.achievementCol} is the column number for the course of choice\n${achievementData.numberOfPriorCompletions} is the number of prior completions`
  //Add 1 to it
  var newNumCompletions = iterateAchievements(achievementData.numberOfPriorCompletions,1)
  prepResults+=`\nNew completions: ${newNumCompletions}`;

  //Post the new results to the proper row in the spreadsheet
  var results = updateCompanyAchievementCell(companyIDCell, achievementData.achievementCol,courseID, newNumCompletions);
  prepResults+=`\n`+JSON.stringify(results)+`Sheet updated with webhook data. Script finished.`;
  return prepResults;
}

function backfillRunner(companyId: string, completedCourseIDs: string[], row: number) {

  //Individually post one course at a time. 
  var courseResults: string[] = completedCourseIDs.map(courseID => {

    var companyIDCell = {row: row, column: 1};
    var prepResults:string = "";
    //check the ss for prior achievements for this specific course
    if (courseID!==""){
      var achievementData = getNumberOfAchievments(courseID, companyIDCell);
      prepResults += `\nAchievement Data: \n${achievementData.achievementCol} is the column number for the course of choice\n${achievementData.numberOfPriorCompletions} is the number of prior completions`
      //Add 1 to it
      var newNumCompletions = iterateAchievements(achievementData.numberOfPriorCompletions,1)
      prepResults+=`\nNew completions: ${newNumCompletions}`;
  
      //Post the new results to the proper row in the spreadsheet
      var results = updateCompanyAchievementCell(companyIDCell, achievementData.achievementCol,courseID, newNumCompletions);
      prepResults+=`\n`+JSON.stringify(results)+`Sheet updated with backfilled data. Script finished.`;
      Logger.log(prepResults);
      return prepResults;
      }else return "Empty course ID.";
    })
    Logger.log(`${courseResults.length} courses backfilled for company ${companyId}`);
}

function getCompanyTrainingRecordFromSheet(companyID: string) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SharpSpring App Training Completion Dash");

  //If the spreadsheet exists
  if (ss) {
    
    //Get the headers from the first row
    var headers: string[] = ss.getRange("A1:J1").getValues()[0];

    //Get the company's row number
    var companyRow: number = getCompanyIDCellFromSS(companyID).row
    
    //If the company has any achievements
    if (companyRow){
      
      //Get the company's training information from the SS
      var companyData: string[] = ss.getRange(companyRow,1,1,10).getValues()[0];

      //Format the training data object with {[col header]: [value]}
      var trainingObj: {[header: string]: string}={};
      
      headers.forEach( (col:string, index) => {

        //create key value pairs like {"Company ID": "3"} or {"MA Essentials": "0"}
        trainingObj[col] = companyData[index];
      });
      return trainingObj;
    }
  
    else {
      console.log("No achievements logged for this company");
      return null;
    }

  }
else {
  console.log("This sheet does not exist.");
  return null;}
}


var testCourseInfo = {
  userId: "c100u234987e",
  courseId: "63754",
  otherstuff: "nooo",
  yep: 17,
  woo: 8
}

function claspTest() {
  Logger.log("Test started");
  runner(litmosTestCode);
}

function columnToLetter(column: number){
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function letterToColumn(letter: string){
  var column = 0, length = letter.length;
  for (var i = 0; i < length; i++)
  {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

var litmosTestCode = { 
  "id": 4513, 
  "created": "2019-05-06T01:13:19.533", 
  "type": "achievement.earned", 
  "object": "event", 
  "data": { 
    "userId": "yj-nr8PhW8o1", 
    "userName": "sample", 
    "courseId": "nAcqwEA8jUo1", 
    "title": "Course Demo", 
    "code": "", 
    "achievementDate": "2019-05-06T01:12:35.990", 
    "compliantTilldate": null, 
    "result": "Completed", 
    "type": "Course Completed", 
    "firstName": "Sample", 
    "lastName": "User", 
    "achievementId": 368800, 
    "certificateId": "biZrK8ab0LE1" 
  }
}

/**
 * here is an example of me pushing some things
 */

 var paramsString: string = 'lastName=User&code&compliantTilldate&certificateId=biZrK8ab0LE1&achievementId=368800&userName=c3u30945835e&title=Course+Demo&type=Course+Completed&userId=c3u308757327e&result=Completed&firstName=Sample&achievementDate=2019-05-06T01%3A12%3A35.990&courseId=asdfljasdj%3Bl3245i734';
