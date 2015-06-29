var _ = require('lodash');
var builder = require('./builder');

function Slx ( sumOfProducts, normalized ) {
    this.sop = sumOfProducts || [[]];
    this.normalized = normalized;
};

module.exports = Slx;
