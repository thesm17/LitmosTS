"use strict";
var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
/**
 * Catches webhooks posted by Litmos
 * @param {Object} e -    An individual achievement being sent from litmos
 * @return {TextOutput} A stringified version of the payload
 */
function doPost(e) {
    var payload = JSON.parse(e.postData.contents).data;
    var keys = Object.keys(payload);
    /** User for testing
     *   var values = keys.map((key) => {return payload[key]});
     *   var userID = payload.userId;
     *   var paramsObject = getJsonFromParams(payload)
     *
     */
    var results = "Incoming data: " + JSON.stringify(payload) + "\n";
    results += runner(payload);
    console.log(results);
    // also for testing
    try {
        var webHookTesterurl = "https://webhook.site/#!/53dc1d7f-2dc4-4f8c-a7b2-377fb6849011";
        var options = {
            'method': 'POST',
            'contentType': 'application/json',
            // Convert the JavaScript object to a JSON string.
            //'payload' : `Keys: ${keys}\nValues: ${values}`
            'payload': results
        };
        var webhookResponse = UrlFetchApp.fetch(webHookTesterurl, options);
        console.log(webhookResponse);
    }
    catch (e) {
        console.log("There was some kind of error posting to the webhook testing site.");
    }
    //return results to poster
    return ContentService.createTextOutput(results);
}
function doGet(e) {
    if (e.parameter.username) {
        var companyID = parseCompanyIdFromLitmosUsername(e.parameter.username);
        var trainingResults = getCompanyTrainingRecordFromSheet(companyID);
        console.log(companyID + ", " + JSON.stringify(trainingResults));
        if (trainingResults) {
            var results = {
                usernameInput: e.parameter.username,
                trainingData: (trainingResults)
            };
            return HtmlService.createHtmlOutput(JSON.stringify(results));
        }
    }
    else
        return HtmlService.createHtmlOutput("No username parameter given.");
}
function parseCompanyIdFromLitmosUsername(username) {
    return username.split("u")[0].substr(1);
}
/**
* Parse SharpSpring companyID and course ID from payload
* @param {Object} payload - The payload from Litmos
* @return {Object} {companyID, courseID} from the achievement
*/
function getCompanyIDAndCourseID(payload) {
    var companyID = parseCompanyIdFromLitmosUsername(payload.userName);
    var data = {
        companyID: companyID,
        courseID: payload.courseId
    };
    return data;
}
/**
 * Search the column of company IDs of the active spreadsheet for the given companyID.
 * If one doesn't exist, create it at the bottom.
 * Return the cell where the company ID is located.
 * If the sheet doesn't exist, return `null`
 * @param {String} companyID SharpSpring company ID.
 * @param {number} column Column containing list of company IDs. The default is column 1
 * @return {Object} {row, column} where the company ID exists.
 */
function getCompanyIDCellFromSS(companyID, column) {
    if (column === void 0) { column = 1; }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    //Define the column to search for matching companyID
    var companyIDColumn = column;
    //Define the bottom row as a search limit
    var lastRow = sheet.getLastRow();
    //Get the range from the spreadsheet and log the range and values
    var r = sheet.getRange(columnToLetter(companyIDColumn) + "1:" + columnToLetter(companyIDColumn) + lastRow);
    console.log("Lookup range: " + columnToLetter(companyIDColumn) + "1:" + columnToLetter(companyIDColumn) + lastRow);
    console.log("Lookup range for company IDs: " + r.getValues());
    //search range r (which is just a single column) for the given company ID. If it doesn't exist, return the first empty row
    var textFinder = r.createTextFinder(companyID);
    //returns the row where the companyID was found else null if it isn't in any row of this column
    var firstOccurance = textFinder.findNext();
    var row, companyIDCell;
    //Check if the companyID was found.
    if (firstOccurance !== null) {
        //If the companyID was found, set companyIDCell to that cell
        row = firstOccurance.getRow();
        companyIDCell = sheet.getRange(row, companyIDColumn);
        console.log("Company ID located in row: " + row);
    }
    else {
        //if the companyID wasn't found, write the first blank cell in the range with the given companyID and use the as the companyIDCell
        row = lastRow + 1;
        companyIDCell = sheet.getRange(row, companyIDColumn).setValue(companyID);
        console.log("Company ID was not found, so it will be added to the bottom of the column in row: " + row);
    }
    //Log result
    console.log("Company ID " + companyID + " is located at " + companyIDCell.getRow() + ", " + companyIDCell.getColumn() + " (row, col)");
    //There's a question of security vs speed on the return
    //The return could use local vars for speed and possibly miss something
    //or grab the values from the sheet for safety but have to add access speed. 
    //The risk seems low but choose as you want
    return { row: row, column: companyIDColumn };
    //return {row: companyIDCell.getRow(), column: companyIDCell.getColumn()};
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
function getLastColumnInRow(row) {
    var col = 1;
    while (sheet.getRange(row, col).isBlank() == false) {
        col++;
    }
    return col - 1;
}
function getNumberOfAchievments(courseID, companyIDCell) {
    //Search for column for this courseID
    //count how many filled rows there are
    var lastColumn = getLastColumnInRow(companyIDCell.row);
    Logger.log("Last column: " + lastColumn);
    //define the search range up to the last nonempty cell
    var r = sheet.getRange(companyIDCell.row, 1, 1, lastColumn);
    var textFinder = r.createTextFinder(courseID);
    var firstOccurance = textFinder.findNext();
    var col, numberOfPriorCompletions;
    //returns null if it isn't in the sheet 
    if (firstOccurance !== null) {
        col = firstOccurance.getColumn();
    }
    else {
        col = lastColumn + 1;
    }
    ;
    sheet.getRange(companyIDCell.row, col + 1);
    Logger.log("Prior completions would be located at " + companyIDCell.row + " ," + (col + 1));
    if (sheet.getRange(companyIDCell.row, col + 1).isBlank()) {
        numberOfPriorCompletions = 0;
    }
    else {
        numberOfPriorCompletions = sheet.getRange(companyIDCell.row, col + 1).getValue();
    }
    Logger.log("Number of completions: " + numberOfPriorCompletions);
    return {
        achievementCol: col,
        numberOfPriorCompletions: numberOfPriorCompletions
    };
}
/**
 * Iterate achievements
 * @param {number} priorNumberOfAchievements
 * @param {number=} interator - number to increase by
 * @return {number} return sum of numberOfAchievements + interator
 */
function iterateAchievements(priorNumberOfAchievements, iterator) {
    return (priorNumberOfAchievements + iterator);
}
/**
 * Post new achievement number to spreadsheet
 * @param {{number,number}} companyIDCell
 * @param {number} achievementColumn
 * @param {string} courseID
 * @param {number} numberOfAchievements
 * @return {} getRange(row, column, 1,2).setValues([courseID, numberOfAchievements+1])
 */
function updateCompanyAchievementCell(companyIDCell, achievementColumn, courseID, numberOfAchievements) {
    var achData = [courseID, numberOfAchievements];
    var r = sheet.getRange(companyIDCell.row, achievementColumn, 1, 2);
    Logger.log(r);
    Logger.log(r.getValues());
    Logger.log("Made it to the troublesome bit...");
    var results = r.setValues([achData]);
    Logger.log("Updated values: " + results.getValues);
}
/**
 *
 * @param {number} payload comes from webhook
 * @return {void}
 *
 */
function runner(payload) {
    var prepResults = "";
    prepResults += "\npayload gotten!";
    //Parse companyID and courseID from webhook
    var _a = getCompanyIDAndCourseID(payload), companyID = _a.companyID, courseID = _a.courseID;
    Logger.log(companyID + "\n" + courseID);
    //Get the cell in the spreadsheet where the companyID is located. If it hasn't existed before, add it to the companyID column at the bottom-most row.
    var companyIDCell = getCompanyIDCellFromSS(companyID);
    //Grab that company's achievement record for the given courseId. If There aren't any, return zero
    var achievementData = getNumberOfAchievments(courseID, companyIDCell);
    prepResults += "\nAchievement Data: \n" + achievementData.achievementCol + " is the column number for the course of choice\n" + achievementData.numberOfPriorCompletions + " is the number of prior completions";
    //Add 1 to it
    var newNumCompletions = iterateAchievements(achievementData.numberOfPriorCompletions, 1);
    prepResults += "\nNew completions: " + newNumCompletions;
    //Post the new results to the proper row in the spreadsheet
    var results = updateCompanyAchievementCell(companyIDCell, achievementData.achievementCol, courseID, newNumCompletions);
    prepResults += "\n" + JSON.stringify(results) + "Sheet updated with webhook data. Script finished.";
    return prepResults;
}
function backfillRunner(companyId, completedCourseIDs, row) {
    //Individually post one course at a time. 
    var courseResults = completedCourseIDs.map(function (courseID) {
        var companyIDCell = { row: row, column: 1 };
        var prepResults = "";
        //check the ss for prior achievements for this specific course
        if (courseID !== "") {
            var achievementData = getNumberOfAchievments(courseID, companyIDCell);
            prepResults += "\nAchievement Data: \n" + achievementData.achievementCol + " is the column number for the course of choice\n" + achievementData.numberOfPriorCompletions + " is the number of prior completions";
            //Add 1 to it
            var newNumCompletions = iterateAchievements(achievementData.numberOfPriorCompletions, 1);
            prepResults += "\nNew completions: " + newNumCompletions;
            //Post the new results to the proper row in the spreadsheet
            var results = updateCompanyAchievementCell(companyIDCell, achievementData.achievementCol, courseID, newNumCompletions);
            prepResults += "\n" + JSON.stringify(results) + "Sheet updated with backfilled data. Script finished.";
            Logger.log(prepResults);
            return prepResults;
        }
        else
            return "Empty course ID.";
    });
    Logger.log(courseResults.length + " courses backfilled for company " + companyId);
}
function getCompanyTrainingRecordFromSheet(companyID) {
    var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SharpSpring App Training Completion Dash");
    //If the spreadsheet exists
    if (ss) {
        //Get the headers from the first row
        var headers = ss.getRange("A1:J1").getValues()[0];
        //Get the company's row number
        var companyRow = getCompanyIDCellFromSS(companyID).row;
        //If the company has any achievements
        if (companyRow) {
            //Get the company's training information from the SS
            var companyData = ss.getRange(companyRow, 1, 1, 10).getValues()[0];
            //Format the training data object with {[col header]: [value]}
            var trainingObj = {};
            headers.forEach(function (col, index) {
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
        return null;
    }
}
var testCourseInfo = {
    userId: "c100u234987e",
    courseId: "63754",
    otherstuff: "nooo",
    yep: 17,
    woo: 8
};
function claspTest() {
    Logger.log("Test started");
    runner(litmosTestCode);
}
function columnToLetter(column) {
    var temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}
function letterToColumn(letter) {
    var column = 0, length = letter.length;
    for (var i = 0; i < length; i++) {
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
};
/**
 * here is an example of me pushing some things
 */
var paramsString = 'lastName=User&code&compliantTilldate&certificateId=biZrK8ab0LE1&achievementId=368800&userName=c3u30945835e&title=Course+Demo&type=Course+Completed&userId=c3u308757327e&result=Completed&firstName=Sample&achievementDate=2019-05-06T01%3A12%3A35.990&courseId=asdfljasdj%3Bl3245i734';
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
function runThisNow() {
    var row = 1;
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
// Note: To support older browsers and Node <6.0, you must import the ES5 bundle instead.
var Bottleneck = require("bottleneck/es5");
var limiter = new Bottleneck({
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 60 * 1000,
    // also use maxConcurrent and/or minTime for safety
    maxConcurrent: 1,
    minTime: 333 // pick a value that makes sense for your use case
});
//count job for debugging
var counts = limiter.counts();
console.log("Counts initialized. Number of counts: " + counts);
function updateRow_bn(row) {
    //Get the company ID from the given row by getting the value in the first column
    var companyID = sheet.getRange(row, 1).getValue();
    //Get all the users associated with the given SharpSpring company ID from Litmos. 
    var users = getAllCompanyUsers(companyID);
    console.log("All users gotten. Number of counts: " + counts);
    //If there are some users then
    if (users) {
        //Loop through all users and get their individual achievements
        var allUserAchievements = limiter.schedule(function () {
            var allAchvs = users.map(function (user) { return getUserAchievements(user.Id); });
            console.log("In the midst of looping. Number of counts: " + counts);
            return Promise.all(allAchvs);
        });
        console.log("Looping finished. Number of counts: " + counts);
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
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
/**
 * this function will take a company ID as a param, and use the active cell column to look up the course name, and use that to look up the course ID. then find the corresponding row on the raw data sheet to identify the proper column, and grab the number of completions
 */
function getNumberOfCompletions() {
    var rawDataSheet = ss.getSheetByName("Raw Data");
    if (rawDataSheet) {
        var cell = sheet.getActiveCell(), row = cell.getRow(), col = cell.getColumn();
        var courseName = sheet.getRange(1, col).getValue();
        var courseID = newvlookup(ss.getSheetByName("Course Name Lookup"), 2, 1, courseName);
        var allCompanyCourses = rawDataSheet.getRange(row + ":" + row).getValues()[0];
        var specificCourseCellColumn = 0;
        for (var i = 1; i < allCompanyCourses.length; i++) {
            if (stringsEqual(allCompanyCourses[i - 1], courseID))
                specificCourseCellColumn = i;
            else
                continue;
        }
        console.log(specificCourseCellColumn);
        var numCompletions = rawDataSheet.getRange(row, specificCourseCellColumn + 1).getValue();
        return numCompletions;
    }
    else {
        return null;
    }
}
/*
Imitates the Vlookup function. Receives:
1. sheet - A reference to the sheet you would like to run Vlookup on
2. column - The number of the column the lookup should begin from
3. index - The number of columns the lookup should cover.
4. value - The desired value to look for in the column.
Once the cell of the [value] has been found, the returned parameter would be the value of the cell which is [index] cells to the right of the found cell.
*/
function newvlookup(sheet, column, index, value) {
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(1, column, lastRow, column + index).getValues();
    console.log(data);
    for (var i = 0; i < data.length; ++i) {
        if (data[i][0] == value) {
            return data[i][index];
        }
    }
}
//# sourceMappingURL=ParseRawData.js.map
function stringsEqual(str1, str2) {
    return (str1 === str2);
}
/**
 * @param username Litmos username following cXXXXuXXXXe pattern
 * @return
 */
function getUserAchievements(username) {
    return getLitmosAchievements(username);
}
var baseUrl = "https://api.litmos.com/v1.svc/";
var options = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
        'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54'
    }
};
function getUser(username) {
    var url = baseUrl + "/users/" + username + "?source=smittysapp&format=json";
    try {
        var result = UrlFetchApp.fetch(url, options);
        var user = JSON.parse(result.getContentText());
        return user;
    }
    catch (err) {
        Logger.log(err);
    }
}
function getLitmosAchievements(username) {
    var url = "https://api.litmos.com/v1.svc/achievements?userid=" + username + "&source=smittysapp&format=json";
    var result = UrlFetchApp.fetch(url, options);
    var achievements = JSON.parse(result.getContentText());
    var achievementCourseIds = achievements.map(function (achievement) { return achievement.CourseId; });
    return achievementCourseIds;
}
function getAllCompanyUsers(companyID) {
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c" + companyID + "u";
    var result = UrlFetchApp.fetch(url, options);
    var users = JSON.parse(result.getContentText());
    if (users)
        return users;
    else
        return null;
}
function getCourseUsers(courseID) {
    var url = "https://api.litmos.com/v1.svc/courses/" + courseID + "/users?source=smittysapp&format=json";
    try {
        var result = UrlFetchApp.fetch(url, options);
        var users = JSON.parse(result.getContentText());
        return users;
    }
    catch (err) {
        Logger.log(err);
    }
}
function testRunner1() {
    var allAchievements = getLitmosAchievements("c3u313420602e");
}
testRunner1();
//# sourceMappingURL=main.js.map