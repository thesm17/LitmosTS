"use strict";
function runEveryNight() {
    ScriptApp.newTrigger('updateTraining_By_Day_Sheet').timeBased().atHour(20).everyDays(1).create();
}
function updateTraining_By_Day_Sheet() {
    refreshUserProps_2();
    ScriptApp.newTrigger('updateTrainingStatus2').timeBased().everyMinutes(1).create();
}
//with a 1 minute delay between, run through all the rows in the first, then second, then third sheets
function updatePage1() {
    refreshUserProps_();
    setPage(0);
    ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function updatePage2() {
    refreshUserProps_();
    setPage(1);
    ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function updatePage3() {
    refreshUserProps_();
    setPage(2);
    ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function updatePage4() {
    //reset loop counter to 0
    refreshUserProps_();
    //set the appropriate page for updating
    setPage(3);
    console.log("Set page to (zero-indexed) 3");
    //establish trigger to update training statuses
    ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
//this is going to be slightly more tricky trying to figure out how to get the page into the trigger. come back to this one later
function updateArbitraryPage() {
    // refreshUserProps_();
    // setPage("somePage");
    // ScriptApp.newTrigger('updateTrainingStatusOnSheet').timeBased().everyMinutes(1).create();
}
function refreshUserProps_() {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('loopCounter', "0");
}
function setPage(page) {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('page', "" + page);
}
function updateTrainingStatusOnSheet() {
    var userProperties = PropertiesService.getUserProperties();
    var loopCounter = Number(userProperties.getProperty('loopCounter'));
    var page = Number(userProperties.getProperty('page'));
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[page];
    //Test to make sure the proper sheet is being edited
    console.log("Sheet to update: " + sheet.getSheetName());
    //This line is improperly grabbing all 1000 rows even though most are blank. Going to try again with a custom function.
    //var totalRows = sheet.getLastRow();
    var totalRows = getLastRowInColumn_(sheet, 1);
    var limit = totalRows - 1; //subtract 1 to deal with headers
    Logger.log("Page number " + page + " has " + limit + " workable rows");
    //if there are still rows left:
    if (loopCounter < limit) {
        // use the loop number to grab that row's company ID. then run that through getting company info, and use that to display onto the sheet.
        var workingRow = loopCounter + 2; //adds 1 to the looper to handle headers
        Logger.log("Working on row " + workingRow);
        var companyIDColumn = 1;
        var companyID = sheet.getRange(workingRow, companyIDColumn).getValue();
        //adjust this number to increase reporting range
        //var reportThresholdCell = sheet.getRange("I1").getValue();
        var reportThresholdCell = 7;
        Logger.log("report threshold: " + reportThresholdCell);
        //get training data for the given company, with a reporting threshold of 7 days (defined above)
        var trainingData = (getCompanyTrainingStatus(companyID, reportThresholdCell));
        Logger.log(JSON.stringify(trainingData));
        //format and display it on the sheet
        var formattedRange = formatRange_(trainingData);
        var sheetUpdateStatus = updateSheetWithNewTrainingInfo(workingRow, formattedRange, sheet);
        Logger.log("Sheet successfully updated with the data: " + sheetUpdateStatus.getValues());
        // increment the properties service counter for the loop
        loopCounter += 1;
        userProperties.setProperty('loopCounter', "" + loopCounter);
        // see what the counter value is at the end of the loop
        Logger.log("Loop counter: " + loopCounter);
    }
    else {
        //There are no more rows to update, so delete the trigger
        deletePageUpdateTrigger_();
    }
}
function getCertifiedUsers_(ts) {
    //give a list of certified learners
    var certifiedUsers;
    Logger.log("Certified users: " + JSON.stringify(ts.certifiedUsers));
    if ((typeof ts.certifiedUsers !== 'undefined') && ts.certifiedUsers.length > 0) {
        certifiedUsers = ts.certifiedUsers.map(function (user) {
            return user.name;
        });
        certifiedUsers = certifiedUsers.join(", ");
    }
    else
        certifiedUsers = "No certified users.";
    return certifiedUsers;
}
function getRecentUsers_(ts) {
    //give a list of recent learners
    var recentLearners;
    if ((typeof ts.completedCoursesThisWeek !== 'undefined') && ts.completedCoursesThisWeek.length > 0) {
        recentLearners = ts.completedCoursesThisWeek.map(function (user) {
            return user.name;
        });
        recentLearners = recentLearners.join(", ");
    }
    else
        recentLearners = "No recent users.";
    Logger.log("Recent learners: " + recentLearners);
    return recentLearners;
}
function updateSheetWithNewTrainingInfo(row, rangeValues, sheet, trainingStatusColumn) {
    if (trainingStatusColumn === void 0) { trainingStatusColumn = 4; }
    //check if the training status column param was given
    //if not, prep data to be stuck into column 5 (or any column based on the sheet's needs)
    if (!trainingStatusColumn) {
        trainingStatusColumn = 4;
    }
    Logger.log("Row to post to: " + row);
    Logger.log("Range values: \n" + rangeValues);
    var range = sheet.getRange(row, trainingStatusColumn, 1, 5);
    var formattedResults = range.setValues([rangeValues]);
    var actualRange = range.getValues();
    return formattedResults;
}
function formatRange_(trainingStatus) {
    /*need to set:
    *E-row to training status
    *F-row to the current time
    *G-row to number of learners
    *H-row to name of certified learners
    *I-Row to names of users with recent completions
    use setValues
    */
    var certifiedUsers = getCertifiedUsers_(trainingStatus);
    var recentUsers = getRecentUsers_(trainingStatus);
    Logger.log("formatRange, recentUsers:\n" + recentUsers);
    var values = [
        trainingStatus.trainingStatus,
        (new Date()),
        trainingStatus.totalLearners,
        certifiedUsers,
        recentUsers
    ];
    return values;
}
function deletePageUpdateTrigger_() {
    // Loop over all triggers and delete the ones which are running the updateTrainingStatus function
    var allTriggers = ScriptApp.getProjectTriggers();
    var triggersToDelete = allTriggers.filter(function (trigger) {
        return (trigger.getHandlerFunction() == "updateTrainingStatusOnSheet");
    });
    for (var i = 0; i < triggersToDelete.length; i++) {
        ScriptApp.deleteTrigger(triggersToDelete[i]);
    }
}
function updateCustomRow() {
    //define the row and sheet to update based on sheets row #
    var row = 3;
    //var sheetNum = 0;
    refreshUserProps_();
    setPage(3);
    var userProperties = PropertiesService.getUserProperties();
    var loopCounter = Number(userProperties.getProperty('loopCounter'));
    var sheetNum = Number(userProperties.getProperty('page'));
    //Run it!
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[sheetNum];
    var sheetName = sheet.getName();
    var companyID = sheet.getRange(row, 1).getValue();
    var reportingThreshold = 7;
    var trainingData = getCompanyTrainingStatus(companyID, reportingThreshold);
    var formattedRange = formatRange_(trainingData);
    var sheetUpdateStatus = updateSheetWithNewTrainingInfo(row, formattedRange, sheet);
    Logger.log("\nSheet successfully updated with the data: " + sheetUpdateStatus.getValues());
}
function learnUserProperties() {
    var userProperties = PropertiesService.getUserProperties();
    var props = userProperties.getProperties();
    var name = sheet.getSheetName();
    Logger.log("props gotten!");
}
function getCompanyTrainingArray_(companyLookupInfo) {
    var companyID = companyLookupInfo[0], daysSinceOBSD = companyLookupInfo[2];
    //Get all achievements for users from Litmos. 
    console.log("Getting user achievements.");
    // ! Do I need to add an async/await here?
    var userHistories = getCompanyHistoricalAchievementArray_(companyID, daysSinceOBSD, 60);
}
/**
 * This helper resets the looper to 0.
 */
function refreshUserProps_2() {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('looper_companyTrainingByDay', "0");
}
/**
 * This function is triggered to run every minute starting at 8 p.m.
 */
function updateTrainingStatus2() {
    try {
        //Figure out which row to update next
        var userProperties = PropertiesService.getUserProperties();
        var loopCounter = Number(userProperties.getProperty('looper_companyTrainingByDay'));
        //Get the spreadsheet to update
        //var ss = SpreadsheetApp.getS
        var sheet = ss.getSheetByName("Company Training By Day");
        if (sheet) {
            //Test to make sure the proper sheet is being edited
            console.log("Sheet to update: " + sheet.getSheetName());
            //Set the number of header rows
            var numHeaderRows = 4;
            var totalRows = getLastRowInColumn_(sheet, 1, numHeaderRows);
            console.log("Currently calculating the sheet has " + totalRows + ". \n'updateTrainingStatus2' will try and loop through all those, besides the headers. ");
            var limit = totalRows - numHeaderRows; //subtract to deal with headers
            Logger.log("This page has " + limit + " workable rows");
            //if there are still rows left:
            if (loopCounter < limit) {
                //Use the loop number to grab that row's company ID (column 1)
                //Then run that through getting company info, and use that to display onto the sheet.
                var workingRow = loopCounter + numHeaderRows + 1; //add an extra 1 because the array is 0-indexed, but the sheet's rows are 1-indexed
                Logger.log("Working on row " + workingRow);
                //Do all the work!
                displayCompanyHistoricTrainingResultsOnOnRow_(workingRow);
                // increment the properties service counter for the loop
                loopCounter += 1;
                userProperties.setProperty('looper_companyTrainingByDay', "" + loopCounter);
                // see what the counter value is at the end of the loop
                Logger.log("Loop counter: " + loopCounter);
            }
            else {
                //There are no more rows to update, so delete the trigger
                deletePageUpdateTrigger_();
            }
        }
    }
    catch (err) {
        console.log(err);
        throw new Error(err);
    }
}
//# sourceMappingURL=triggers.js.map