var _ = require('lodash');
var Slx = require('./constructor');
var builder = require('./builder');

function not() {
    var sum = this.rep;
    // ¬(a ⋁ b) ⟶ ¬a ⋀ ¬b
    return _(sum).map( invertProduct )
        .reduce( function (a,b) {
            return a.and(b);
        });
}

function invertProduct (array) {
    // ¬(a ⋀ b) ⟶ ¬a ⋁ ¬b
    return _(array).map( invertTerm )
        .reduce( function (a,b) {
            return a.or(b);
        });
}

function invertTerm (term) {
    var type = term.type,
        literal = type === 'fn' ?
            builder.createFn( term.fn, term.arg, true ) :
            builder.createLiteral( type, term, true )

    return (new Slx( [[literal]] )).normal();
}

module.exports = not;
