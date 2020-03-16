function getLastColumnInRow_ (sheet: any, row: number) {
  var col = 1;
  while (sheet.getRange(row,col).isBlank()==false) {col++}
  return col-1;
}

function getLastRowInColumn_ (sheet: any, col: number) {
  var row = 1;
  while (sheet.getRange(row,col).isBlank()==false) {row++}
  return row-1;
}