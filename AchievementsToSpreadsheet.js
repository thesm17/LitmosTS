var payload = {};
/**
 * Catches webhooks posted by Litmos
 * @param {Object} e -    An individual achievement being sent from litmos
 * @return {TextOutput} A stringified version of the payload
 */
function doPost(e) {
    payload = e;
    return HtmlService.createHtmlOutput(JSON.stringify(payload));
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
    var companyID = parseCompanyIdFromLitmosUsername(payload.userId);
    var data = {
        companyID: companyID,
        courseID: payload.courseId
    };
    return data;
}
/**
 * Search spreadsheet rows for the matching companyID row. If one doesn't exist, create it at the bottom.
 * @param {String} companyID - SharpSpring company ID
 * @param {Sheet} sheet - A Google sheet (Spreadsheet.sheet)
 * @return {number} - Row where the company ID exists;
 */
function getCompanySpreadSheetRow(companyID, sheet) {
    //sheet.
}
/**
 * Find how many of this achievement a given company has
 * @param {string} courseID - Litmos course ID from achievement record
 * @param {row} row - spreadsheet row for the given company
 * @return {Object}
  * {
  *   column: column where the matching achievement exists (or first empty column),
  *   priorNumberOfAchievements:  corresponding # of completions
  * }
 */
/**
 * Iterate achievements
 * @param {number} priorNumberOfAchievements
 * @param {number=} interator - number to increase by
 * @return {number} return sum of numberOfAchievements + interator
 */
/**
 * Post new achievement number to spreadsheet
 * @param {number} row
 * @param {number} column
 * @param {string} courseID
 * @param {number} numberOfAchievements
 * @return {Range} getRange(row, column, 1,2).setValues([courseID, numberOfAchievements+1])
 */
var testCourseInfo = {
    userId: "100",
    courseId: "123",
    otherstuff: "nooo",
    yep: 17,
    "true": true
};
console.log(getCompanyIDAndCourseID(testCourseInfo));
