function runEveryNight() {
  ScriptApp.newTrigger('updatePage1').timeBased().atHour(1).everyDays(1).create();
  ScriptApp.newTrigger('updatePage2').timeBased().atHour(3).everyDays(1).create();
  ScriptApp.newTrigger('updatePage3').timeBased().atHour(5).everyDays(1).create();

}


//with a 1 minute delay between, run through all the rows in the first, then second, then third sheets
function updatePage1() {
  refreshUserProps();
  setPage(0);
  ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function updatePage2() {
  refreshUserProps();
  setPage(1);
  ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function updatePage3() {
  refreshUserProps();
  setPage(2);
  ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}

//this is going to be slightly more tricky trying to figure out how to get the page into the trigger. come back to this one later
function updateArbitraryPage() {
  refreshUserProps();
  setPage("somePage");
  ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}

function refreshUserProps() {
  userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('loopCounter', 0);
}

function setPage(page) {
  userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('page', page);
}

function updateTrainingStatusOnSheet() {
  var userProperties = PropertiesService.getUserProperties();
  var loopCounter = Number(userProperties.getProperty('loopCounter'));
  var page = Number(userProperties.getProperty('page'));
  
  // if (Number.isNan(page)) {
  //   //figure out how to set the proper page using the current sheet?
  // }  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[page];
  var totalRows = sheet.getLastRow();
  var limit = totalRows-1 //subtract 1 to deal with headers
  Logger.log("Page number "+page+" has "+limit+" workable rows")
  
  //if there are still rows left:
  if (loopCounter<limit) {
    
    // use the loop number to grab that row's company ID. then run that through getting company info, and use that to display onto the sheet.
    var workingRow = loopCounter+2 //adds 1 to the looper to handle headers
    Logger.log("Working on row "+workingRow);
    var companyIDColumn = 1;
    var companyID = sheet.getRange(workingRow,companyIDColumn).getValue();

    //adjust this number to increase reporting range
    //var reportThresholdCell = sheet.getRange("I1").getValue();
    var reportThresholdCell = 7;
    Logger.log("report threshold: "+reportThresholdCell);
    //get training data for the given company, with a reporting threshold of 7 days (defined above)
    var trainingData = (getCompanyTrainingStatus(companyID, reportThresholdCell));
    Logger.log(JSON.stringify(trainingData));

        //format and display it on the sheet
    var formattedRange = formatRange(trainingData);
    var sheetUpdateStatus = updateSheetWithNewTrainingInfo(workingRow, formattedRange, sheet);
    Logger.log("Sheet successfully updated with the data: "+sheetUpdateStatus.getValues());

    // increment the properties service counter for the loop
    loopCounter +=1;
    userProperties.setProperty('loopCounter', loopCounter);
    
    // see what the counter value is at the end of the loop
    Logger.log("Loop counter: "+loopCounter);
  } else {
    //There are no more rows to update, so delete the trigger
    deletePageUpdateTrigger();
  } 
  


}

function logTestCompanyTrainingStatus () {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[1];
  var companyID = "308479799";
  var row = 9;
  var rTC = "7";
  var trainingData = getCompanyTrainingStatus(companyID, rTC);
  var formattedRange = formatRange(trainingData);
  var sheetUpdateStatus = updateSheetWithNewTrainingInfo(row, formattedRange, sheet);
  Logger.log("\nSheet successfully updated with the data: "+sheetUpdateStatus.getValues());
}

function getCertifiedUsers_ (ts) {
  //give a list of certified learners
  var certifiedUsers;
  Logger.log("Certified users: "+JSON.stringify(ts.certifiedUsers))
  if ((typeof ts.certifiedUsers !=='undefined')&&ts.certifiedUsers.length>0) {
    certifiedUsers = ts.certifiedUsers.map(function (user){
      return user.name
    })
    certifiedUsers = certifiedUsers.join(", ");
  } else certifiedUsers = "No certified users."
  return certifiedUsers;
}

function getRecentUsers_ (ts) {
  //give a list of recent learners
  var recentLearners;
  if ((typeof ts.completedCoursesThisWeek !== 'undefined')&&ts.completedCoursesThisWeek.length>0) {
    recentLearners = ts.completedCoursesThisWeek.map(function (user){
      return user.name      
    })
    recentLearners = recentLearners.join(", ");
  } else recentLearners = "No recent users.";
  Logger.log("Recent learners: "+recentLearners);
  return recentLearners;
}

function updateSheetWithNewTrainingInfo (row, rangeValues, sheet) {
  Logger.log("Row to post to: "+row);
  Logger.log("Range values: \n"+rangeValues);
  var range = sheet.getRange(row,4,1,5);  
  var formattedResults = range.setValues([rangeValues]);
  return formattedResults;
}

function formatRange(trainingStatus) {
  /*need to set:
  *C-row to training status
  *D-row to the current time
  *E-row to number of learners
  *F-row to name of certified learners
  *G-Row to names of users with recent completions
  use setValues
  */

  var certifiedUsers = getCertifiedUsers_(trainingStatus);
  var recentUsers = getRecentUsers_(trainingStatus);
  Logger.log("formatRange, recentUsers:\n"+recentUsers);
  var values =[
    trainingStatus.trainingStatus, 
    (new Date()), 
    trainingStatus.totalLearners,
    certifiedUsers,
    recentUsers
  ];
  return values
}

function deletePageUpdateTrigger() {
  // Loop over all triggers and delete the ones which are running the updateTrainingStatus function
  var allTriggers = ScriptApp.getProjectTriggers();
  var triggersToDelete = allTriggers.filter(function (trigger) {
    return (trigger.getHandlerFunction()=="updateTrainingStatusOnSheet")
  });

  for (var i = 0; i < triggersToDelete.length; i++) {
    ScriptApp.deleteTrigger(triggersToDelete[i]);
  }
}