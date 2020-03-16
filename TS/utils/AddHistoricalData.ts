function setupHistoricalTrigger () {
  ScriptApp.newTrigger('storeCurrentStatusForWeek').timeBased().atHour(12).onWeekDay(ScriptApp.WeekDay.SUNDAY).create();
}

var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getSheetByName("Historical Training Status");

function storeCurrentStatusForWeek() {
  var numRows = getLastRowInColumn_(sheet, 1);
  
  var trainingDataRange = sheet.getRange(2,15,numRows,10)
  var trainingDataValues = trainingDataRange.getValues();
  var newTrainingStatus = trainingDataValues.map(function (value, row) {
    var rowStatus = calculateRowTrainingStatus_(row+2);
    if (rowStatus) {
      return rowStatus} 
    else {
      return value; }
  })
  trainingDataRange.setValues(newTrainingStatus);
}

function calculateRowTrainingStatus_ (rowNum) {
  //get the onboarding start date value
  var onboardingStartDate = sheet.getSheetValues(rowNum,14,1,1)[0][0];

  //check that an onboarding start date exists
  if ( onboardingStartDate instanceof Date){

    //Get current training status
    //the second arg, 4, is which column the training status is in
    var currentTrainingStatus = sheet.getSheetValues(rowNum,4,1,1)[0][0];

    //Get range filled with historic training values (columns N-W)
    //This is an 10 cell zero-indexed array where the 10 cells are the training status for each week in one cell
    var historicRange = sheet.getRange(rowNum,15,1,10);
    var historicRangeValues = historicRange.getValues()[0];

    //Calculate how many weeks since they started. 
    var weekNumber = Math.abs(weeksBetween_((new Date()),onboardingStartDate))-1;

    //Check if they have matured yet
      if (weekNumber>10) {
        
        //If matured, log and return the original range
        console.log(`Row ${rowNum} has already matured. They would be in Onboarding week ${weekNumber}`);
        return historicRangeValues}

    //If not yet matured
      else {
        //Set the new value into the proper cell, subtracting 1 for zero-indexing
        historicRangeValues[weekNumber-1]=currentTrainingStatus;
        console.log(`Successfully logged data for week ${weekNumber} in row ${rowNum}`);
        return historicRangeValues;
      }

    
    } 
    //No onboarding start date has been entered, so there isn't any data to put into the ss
    else {
      console.log(`No onboarding start date entered for row ${rowNum}`); 
      return historicRangeValues}
 }


function getLastColumnInRow_ (sheet, row) {
  var col = 1;
  while (sheet.getRange(row,col).isBlank()==false) {col++}
  return col-1;
}

function getLastRowInColumn_ (sheet, col) {
  var row = 1;
  while (sheet.getRange(row,col).isBlank()==false) {row++}
  return row-1;
}

function historicRunner() {
  var res = storeRowTrainingStatus_(296);
}

function weeksBetween_(d1, d2) {
  console.log(`Exact time since starting is ${(d2 - d1) / (7 * 24 * 60 * 60 * 1000)}`)
  return Math.ceil((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
}