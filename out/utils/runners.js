"use strict";
function timeTester() {
    var t1 = millsSince("04/24/1990");
    var t2 = millsSince(new Date());
    var t3 = millsSince(new Date, new Date(1990, 4, 24));
}
timeTester();
//# sourceMappingURL=runners.js.map