"use strict";

var slx = require('../src/slx');

describe("known failures", function () {
});

require('./test-parse.js');
require('./test-normal.js');
require('./test-or.js');
require('./test-and.js');
require('./test-not.js');
require('./test-implies.js');
