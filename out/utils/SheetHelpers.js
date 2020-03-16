"use strict";
function getLastColumnInRow_(sheet, row) {
    var col = 1;
    while (sheet.getRange(row, col).isBlank() == false) {
        col++;
    }
    return col - 1;
}
function getLastRowInColumn_(sheet, col) {
    var row = 1;
    while (sheet.getRange(row, col).isBlank() == false) {
        row++;
    }
    return row - 1;
}
//# sourceMappingURL=SheetHelpers.js.map