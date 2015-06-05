// slx - Manipulate selector expressions using predicate logic.

"use strict";

var Slx = require('./src/constructor');
Slx.prototype.normal = require('./src/normal');
Slx.prototype.toString = require('./src/toString');
Slx.prototype.or = require('./src/or');
Slx.prototype.and = require('./src/and');
Slx.prototype.not = require('./src/not');

var slx = require("./src/slx");

module.exports = slx;
