var _ = require('lodash');
var Slx = require('./constructor');

function and ( b ) {
    var a = this,
        i, j;

    return new Slx( _.flatten( a.rep.map( function (aTerm) {
        return b.rep.map( function (bTerm) {
            return aTerm.concat(bTerm);
        });
    })));
}

module.exports = and;
