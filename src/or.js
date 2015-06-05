var _ = require('lodash');
var Slx = require('./constructor');

function or ( b ) {
    var a = this;

    return (new Slx( _.union(a.rep, b.rep) )).normal();
}

module.exports = or;
