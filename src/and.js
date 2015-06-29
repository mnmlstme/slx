var _ = require('lodash');
var Slx = require('./constructor');

function and ( b ) {
    var a = this,
        i, j;

    return (new Slx( _.flatten( a.sop.map( function (aTerm) {
        return b.sop.map( function (bTerm) {
            return _.union(aTerm,bTerm);
        });
    })))).normal();
}

module.exports = and;
