var _ = require('lodash');
var Slx = require('./constructor');
var builder = require('./builder');

function not() {
    var sum = this.sop;
    // ¬(a ⋁ b) ⟶ ¬a ⋀ ¬b
    return _(sum).map( invertProduct )
        .reduce( function (a,b) {
            return a.and(b);
        }).normal();
}

function invertProduct (array) {
    // ¬(a ⋀ b) ⟶ ¬a ⋁ ¬b
    return _(array).map( invertTerm )
        .reduce( function (a,b) {
            return a.or(b);
        });
}

function invertTerm (term) {
    return (new Slx( [[builder.invertTerm(term)]] ));
}

module.exports = not;
