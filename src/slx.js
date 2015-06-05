var _ = require('lodash'),
    Slx = require('./constructor');
    parse = require('./parse');


function slx ( selectorString ) {
    if ( _.isObject(selectorString) && selectorString instanceof Slx ) {
        return selectorString;
    } else {
        return new Slx( parse( selectorString ) );
    }
};

module.exports = slx;
