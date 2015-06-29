var _ = require('lodash');
var Slx = require('./constructor');

function or ( b ) {
    var a = this;

    return (new Slx( _.union(a.sop, b.sop) )).normal();
}

module.exports = or;
