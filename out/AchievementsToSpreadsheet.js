"use strict";
var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
/**
 * Catches webhooks posted by Litmos
 * @param {Object} e -    An individual achievement being sent from litmos
 * @return {TextOutput} A stringified version of the payload
 */
function doPost(e) {
    try {
        var payload = JSON.parse(e.postData.contents).data;
        var results = "Incoming data: " + JSON.stringify(payload) + "\n";
        //Things to do:
        // 1. Check if the achievement was for a certification and if it was, update the proper sheet
        // 2. Display the achievements on the raw data sheet
        // 3. Try posting back somewhere as a test
        // 4. Return the result to the post-er
        //Let's do this!
        //1. Check for certification and post to proper ss
        var wasThisCertification = checkAndPostCertificationCourses(payload);
        results += "\nWas this for certification: " + wasThisCertification;
        results += runner(payload);
        console.log(results);
        return ContentService.createTextOutput("Mission accomplished! Here is the total of what was posted: \n" + results);
    }
    catch (err) {
        console.log("Oh no! there was an error from what was posted. Error: " + JSON.stringify(err));
        return ContentService.createTextOutput("Oh no! there was an error from what was posted. Error: " + JSON.stringify(err.stack));
    }
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
function checkAndPostCertificationCourses(achievement) {
    //1. Check if the achievement is on the achievement list
    //2. If it is, add the new row to the proper sheet
    //1 is MAE exam, 2 is Advanced Exam, 0 is anything else
    var achievementType = checkAchievementType(achievement);
    if (achievementType > 0) {
        var postingStatus = postAchievementToSSv2(achievement, achievementType);
        return postingStatus;
    }
    else
        return "This achievement was not for certification.";
}
function postAchievementToSSv2(achievement, achievementType) {
    var achievementSheetID, sheetName;
    //Configure where to post the new row to.
    switch (achievementType) {
        case 1: {
            achievementSheetID = "1F9nicQLbs1QB9uDE9wZPu7rDFQ-kB7rEG31wOKPB9j0",
                sheetName = "Marketing Automation";
            break;
        }
        case 2: {
            achievementSheetID = "1F9nicQLbs1QB9uDE9wZPu7rDFQ-kB7rEG31wOKPB9j0",
                sheetName = "Advanced Marketing Automation";
            break;
        }
        default: throw new Error("That certification doesn't have a sheet to add new users to. " + achievement.courseId + " doesn't correspond to a certification exam.");
    }
    //Setup sheet to post to
    var sheet = SpreadsheetApp.openById(achievementSheetID).getSheetByName(sheetName);
    if (sheet) {
        //try getting the user and achievements
        try {
            //The sheet needs 5 columns: Full name, Email, Results, Score, and date taken. 
            //Email needs to be gotten separately 
            //Score is actually not accessible via api, so I'm going to just fill in '>80%'
            var user = getUser(achievement.userName);
            var email = user.Email;
            var poster = [achievement.firstName + " " + achievement.lastName, "" + email, "" + achievement.result, ">80%", "" + ("" + achievement.achievementDate.split("T")[0])];
        }
        catch (err) {
            throw new Error(err);
        }
        //Try setting the new row of the sheet
        console.log("Data prepped: " + poster + "\n Setting values into spreadsheed.");
        try {
            var r = sheet.getRange(sheet.getLastRow() + 1, 1, 1, poster.length).setValues([poster]);
        }
        catch (err) {
            throw new Error("Unable to post to sheet: " + err);
        }
        return poster;
    }
    throw new Error("That sheet doesn't exist: " + sheet);
}
function postAchievementToSS(achievement, achievementType) {
    var achievementSheetID, sheetName;
    //Configure where to post the new row to.
    switch (achievementType) {
        case 1: {
            achievementSheetID = "1F9nicQLbs1QB9uDE9wZPu7rDFQ-kB7rEG31wOKPB9j0",
                sheetName = "Marketing Automation";
            break;
        }
        case 2: {
            achievementSheetID = "1F9nicQLbs1QB9uDE9wZPu7rDFQ-kB7rEG31wOKPB9j0",
                sheetName = "Advanced Marketing Automation";
            break;
        }
        default: throw new Error("That certification doesn't have a sheet to add new users to. " + achievement.courseId + " doesn't correspond to a certification exam.");
    }
    //Setup sheet to post to
    var sheet = SpreadsheetApp.openById(achievementSheetID).getSheetByName(sheetName);
    if (sheet) {
        //try getting the user and achievements
        try {
            //The sheet needs 5 columns: Full name, Email, Results, Score, and taken on. 
            //Email and score need to be gotten separately their different GETs
            var user = getUser(achievement.userName);
            var email = user.Email;
            // The score isn't supplied on a webhook event. 
            // Instead, getting the score involves getting all the achievements, locating this one, and then grabbing the score
            var allAchvs = getUserAchievements(user.UserName);
            var thisAch = allAchvs.filter(function (ach) { return ach.CourseId == achievement.courseId; });
            console.log("Matching achievements completed: " + thisAch);
            // If this has been completed multiple times, there could be multiple scores.
            // So get the most recent occurance of this course completion for the score
            var thisSpecificAch = thisAch[thisAch.length - 1];
            var score = thisSpecificAch.Score;
            var poster = [achievement.firstName + " " + achievement.lastName, "" + email, "" + achievement.result, ">80%", "" + achievement.achievementDate.split("T")[0]];
        }
        catch (err) {
            throw new Error(err);
        }
        //Try setting the new row of the sheet
        console.log("Data prepped: " + poster + "\n Setting values into spreadsheed.");
        try {
            var r = sheet.getRange(sheet.getLastRow() + 1, 1, 1, poster.length).setValues([poster]);
        }
        catch (err) {
            throw new Error("Unable to post to sheet: " + err);
        }
        return poster;
    }
    throw new Error("That sheet doesn't exist: " + sheet);
}
function doExternalLog(logger) {
    try {
        var loggingUrl = "https://webhook.site/c2c68fc0-1163-464f-8fc7-11e2f79751cb";
        UrlFetchApp.fetch(loggingUrl, {
            "method": "post",
            'contentType': 'application/json',
            "payload": logger,
        });
    }
    catch (err) {
        throw new Error("Posting to the external site didn't work. sad: " + err);
    }
}
//# sourceMappingURL=AchievementsToSpreadsheet.js.map