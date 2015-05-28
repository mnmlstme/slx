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
    var type = term.type;

    switch ( type ) {
        case 'fn':
            return invertFunction(term);
        case 'universal':
        case 'class':
        case 'tag':
        case 'id':
        case 'attr':
        case 'pseudo':
            return new Slx( [[builder.createLiteral( type, term, true )]] );
        default:
            throw "unhandled: inverting a term of type " + type;
    };
}

function invertFunction (term) {
    var fn = term.fn;

    switch (fn) {
        case 'child':
        case 'next':
            return _.reduce( invertProduct(term.arg).rep.map( function (product) {
                return new Slx( [[builder.createFn( fn, product )]] );
            }), function (a,b) {
                return a.or(b);
            });
        default:
            // the remaining functions cannot be inverted
            return new Slx( [[builder.createFn( fn, term.arg, true )]] );
    }
}

module.exports = not;
