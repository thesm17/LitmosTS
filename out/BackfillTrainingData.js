"use strict";
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
function runThisNow() {
    var userProperties = PropertiesService.getUserProperties();
    var loopCounter = Number(userProperties.getProperty('loopCounter'));
    var page = Number(userProperties.getProperty('page'));  
    var sheet = ss.getSheets()[page];
    var totalRows = sheet.getLastRow();
    var limit = totalRows-2 //subtract 1 to deal with headers and 1 to deal with the problematic SHSP - 3 record
  Logger.log("Page number "+page+" has "+limit+" workable rows")
    //if there are still rows left:
  if (loopCounter<limit) {
    
    // use the loop number to grab that row's company ID. then run that through getting company info, and use that to display onto the sheet.
    var workingRow = loopCounter+3 //adds 1 to the looper to handle headers
  
    Logger.log("Working on row "+workingRow);
   
    //DO THE WORK HERE!!!!!!
    updateRow(workingRow);
    
     // increment the properties service counter for the loop
    loopCounter +=1;
    userProperties.setProperty('loopCounter', loopCounter);
    
    // see what the counter value is at the end of the loop
    Logger.log("Loop counter: "+loopCounter);
  } else {
    //There are no more rows to update, so delete the trigger
    deletePageUpdateTrigger();
  }}

function runner2() {
    var row = 327;
    updateRow(row);
}

function updateRow(row) {
    //var companyIDCell: {row: number, col: number} = {row: row, col: 1};
    var companyID = sheet.getRange(row, 1).getValue();
    //Get all the users associated with the ShSp company ID from Litmos. 
    var users = getAllCompanyUsers(companyID);
    if (users) {
        //Get all achievements from all users
        var allUserAchievements = users.map(function (user) { return getUserAchievements(user.Id); });
        //Get them all into a 1d array
        var allCompanyAchievements = allUserAchievements.join().split(",");
        //Get all the unique course completions
        //This does lose number of unique completions, but that's ok in this case since we're just backfilling
        var uniqueCompanyAchievements = allCompanyAchievements.filter(onlyUnique);
        //For each achievement, pretend that it's being posted through a webhook and run it!
        var results = backfillRunner(companyID, uniqueCompanyAchievements, row);
        return allCompanyAchievements;
    }
}
/**
 * @param {[Object]} users has all company user objects
 */
function filterUsersByAchievement(users) {
}
// function runner(payload:any ) {
//   var prepResults: string = "";
//   //Parse companyID and courseID from webhook
//   var {companyID, courseID} = getCompanyIDAndCourseID(payload);
//   Logger.log(companyID+"\n"+courseID);
//   //Get the cell in the spreadsheet where the companyID is located. If it hasn't existed before, add it to the companyID column at the bottom-most row.
//   var companyIDCell = getCompanyIDCellFromSS(companyID);
//   //Grab that company's achievement record for the given courseId. If There aren't any, return zero
//   var achievementData = getNumberOfAchievments(courseID, companyIDCell);
//   prepResults += `\nAchievement Data: \n${achievementData.achievementCol} is the column number for the course of choice\n${achievementData.numberOfPriorCompletions} is the number of prior completions`
//   //Add 1 to it
//   var newNumCompletions = iterateAchievements(achievementData.numberOfPriorCompletions,1)
//   prepResults+=`\nNew completions: ${newNumCompletions}`;
//   //Post the new results to the proper row in the spreadsheet
//   var results = updateCompanyAchievementCell(companyIDCell, achievementData.achievementCol,courseID, newNumCompletions);
//   prepResults+=`\n`+JSON.stringify(results)+`Sheet updated with webhook data. Script finished.`;
//   return prepResults;
// }
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
//# sourceMappingURL=BackfillTrainingData.js.map