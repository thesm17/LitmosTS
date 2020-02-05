// Compiled using ts2gas 3.4.4 (TypeScript 3.7.5)
var exports = exports || {};
var module = module || { exports: exports };
"use strict";
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
/**
 * this function will take a company ID as a param, and use the active cell column to look up the course name, and use that to look up the course ID. then find the corresponding row on the raw data sheet to identify the proper column, and grab the number of completions
 */
function getNumberOfCompletions() {
    var rawDataSheet = ss.getSheetByName("Raw Data");
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
    Logger.log(specificCourseCellColumn);
    var numCompletions = rawDataSheet.getRange(row, specificCourseCellColumn + 1).getValue();
    return numCompletions;
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
    Logger.log(data);
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
//# sourceMappingURL=module.js.map