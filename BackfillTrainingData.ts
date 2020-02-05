var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];


function runThisNow() {
  var row = 1;
  updateRow(row);
}

function updateRow(row: number) {
  //var companyIDCell: {row: number, col: number} = {row: row, col: 1};
  var companyID: string = sheet.getRange(row,1).getValue();

  //Get all the users associated with the ShSp company ID from Litmos. 
  var users = getAllCompanyUsers(companyID);
  if (users) {
    var allUserAchievements = users.map(user => {return getUserAchievements(user.Id)});
    
    var allCompanyAchievements: [string]=[allUserAchievements.join()];
    var uniqueCompanyAchievements: [string]= [""]
    return allCompanyAchievements;
  }
}


/**
 * @param {[Object]} users has all company user objects
 */
function filterUsersByAchievement(users: [{}] ) {

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

function onlyUnique(value: any, index: number, self: any) { 
  return self.indexOf(value) === index;
}