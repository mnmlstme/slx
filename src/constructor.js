var _ = require('lodash');
var builder = require('./builder');

function Slx ( sumOfProducts ) {
    this.sop = sumOfProducts || [[]];
};

Slx.TOP = new Slx( [[builder.TOP]] );
Slx.BOTTOM = new Slx( [[builder.BOTTOM]] );

module.exports = Slx;
