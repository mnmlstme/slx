var _ = require('lodash');
var builder = require('./builder');
var normalize = require('./normalize');

function Slx ( sumOfProducts ) {
    this.rep = normalize( sumOfProducts || [[]] );
};


module.exports = Slx;
