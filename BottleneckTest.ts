// Note: To support older browsers and Node <6.0, you must import the ES5 bundle instead.
var Bottleneck = require("bottleneck/es5");

const limiter = new Bottleneck({
  reservoir: 100, // initial value
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
 
  // also use maxConcurrent and/or minTime for safety
  maxConcurrent: 1,
  minTime: 333 // pick a value that makes sense for your use case
})

