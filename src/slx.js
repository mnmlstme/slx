var _ = require('lodash');

function slx ( selectorString ) {
    if ( _.isObject(selectorString) && selectorString instanceof Slx ) {
        return selectorString;
    } else {
        return slx.parse( selectorString );
    }
};

module.exports = slx;
