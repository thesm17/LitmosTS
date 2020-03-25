function getLastColumnInRow_ (sheet: any, row: number) {
  var col = 1;
  while (sheet.getRange(row,col).isBlank()==false) {col++}
  return col-1;
}

function getLastRowInColumn_ (sheet: GoogleAppsScript.Spreadsheet.Sheet , col: number,headers:number=0) {
  if (headers === void 0) { headers = 0; }
  var firstDataRow = 1 + headers;
  var iterator = 0;
  var numRows = sheet.getLastRow() - firstDataRow;
  var dataRange = sheet.getRange(firstDataRow, col, numRows,1).getValues();
  //check the the values
  while (typeof dataRange[iterator][0] == "number") {
      iterator++;
  }
  return firstDataRow + iterator - 1;
}