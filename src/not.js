var _ = require('lodash');
var Slx = require('./constructor');

function not() {
    var sum = this.rep;

    // not( a + b + ... ) --> not ( a ) * not ( b ) * ...
    return _.reduce( sum.map( invertProduct ),
        function (a,b) {
            return a.and(b);
        }
    );
}

function invertProduct (array) {

    // not( a * b * ... ) --> not (a) + not(b) + ...
    return _.reduce( array.map( invertTerm ),
        function (a,b) {
            return a.or(b);
        }
    );
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
            return new Slx( [[Slx.createLiteral( type, term, true )]] );
        default:
            throw "unhandled: inverting a term of type " + type;
    };
}

function invertFunction (term) {
    var fn = term.fn,
        invArg = invertProduct(term.arg);

    switch (fn) {
        case 'child':
        case 'next':
            return _.reduce( invArg.rep.map( function (product) {
                return new Slx( [[Slx.createFn( fn, product )]] );
            }), function (a,b) {
                return a.or(b);
            });
        case 'desc':
        case 'succ':
            return _.reduce( invArg.rep.map( function (product) {
                return new Slx( [[Slx.createFn( fn + '*', product )]] );
            }), function (a,b) {
                return a.or(b);
            });
        default:
            throw "unhandled: inverting a " + fn + " function";
    }
}

module.exports = not;
