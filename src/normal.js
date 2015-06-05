var _ = require('lodash');
var builder = require('./builder');
var Slx = require('./constructor');

var MAX_ITERATIONS = 10;

// normalize expressions using term rewriting

function normal ( original ) {
    var original = this;

    return original.normalized ? original :
        new Slx( normalizeProducts( original.rep ), true );
}

// TODO: normalize at the sum level

function normalizeProducts ( originalSum ) {
    return originalSum.map( function (product) {
        var applied,
            outerLoop = 0;

        do {
            applied = false;
            outerLoop++;
            if ( outerLoop > MAX_ITERATIONS ) {
                throw "term rewrite outer loop exceeded max iterations";
            }
            productRules.forEach( function (rule) {
                var applicable,
                    innerLoop = 0;
                do {
                    applicable = rule(product);

                    if( applicable ) {
                        innerLoop++;
                        if ( innerLoop > MAX_ITERATIONS )  {
                            throw "term rewrite inner loop exceeded max iterations";
                        }
                        applied = true;
                        product = applicable(product);
                    }
                } while(applicable);
            });
        } while ( applied );

        return _.sortBy( product, termOrder );
    });
}

var typeOrder = {
    'universal': '0',
    'tag': '1',
    'id': '2',
    'class': '3',
    'attr': '4',
    'pseudo': '5',
    'fn': '6'
};

function termOrder (t) {
    return typeOrder[t.type] + t.name;
}

function rewriteTerms( matchFn, rewriteFn ) {
    return function (product) {
        var m = findTerm( product, matchFn );
        if ( m ) {
            return function (product) {
                var result = _.reject( product, function (t, i) {
                        return i === m.i;
                    });
                result.push( rewriteFn(m.t) );
                return result;
            };
        }
    }
}

function rewriteTermPairs( matchFn, rewriteFn ) {
    return function (product) {
        var m = findPair( product, matchFn );
        if ( m ) {
            return function (product) {
                var result = _.reject( product, function (t, i) {
                        return i === m.i1 || i === m.i2;
                    });
                result.push( rewriteFn(m.t1, m.t2) );
                return result;
            };
        }
    }
}

function findTerm ( product, matchFn ) {
    for ( var i = 0; i < product.length; i++ ) {
        if ( matchFn( product[i] ) ) {
            return{
                t: product[i], i: i
            };
        }
    }
}

function findPair ( product, matchFn ) {
    for ( var i = 0; i < product.length; i++ ) {
        for ( var j = i+1; j < product.length; j++ ) {
            if ( matchFn( product[i], product[j] ) ) {
                return{
                    t1: product[i], i1: i,
                    t2: product[j], i2: j
                };
            }
        }
    }
}

var productRules = [

    // ¬child(a) ⟶ child(¬a)
    // ¬next(a) ⟶ next(¬a)
    rewriteTerms( function (t) {
        return t.type === 'fn' && t.negate && (t.fn === 'child' || t.fn === 'next');
    }, function (t) {
        return builder.createFn(t.fn, t.arg.not());
    }),

    // a ⋀ a ⟶ a
    rewriteTermPairs( function (t1,t2) {
        return t2 === t1;
    }, function (t1) {
        return t1;
    }),

    // a ⋀ ¬a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type !== 'fn' &&
            t2 === builder.createLiteral( t1.type, t1, true );
    }, function () {
        return builder.BOTTOM;
    }),


    // tag:a ⋀ tag:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'tag' && t2.type === 'tag' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return builder.BOTTOM;
    }),

    // id:a ⋀ id:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'id' && t2.type === 'id' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return builder.BOTTOM;
    }),
    // a ⋀ ⊥ ⟶ ⊥
    // ⊥ ⋀ a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.BOTTOM || t2 === builder.BOTTOM;
    }, function () {
        return builder.BOTTOM;
    }),

    // a ⋀ ⊤ ⟶ a
    // ⊤ ⋀ a ⟶ a
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.TOP || t2 === builder.TOP;
    }, function (t1, t2) {
        return t1 === builder.TOP ? t2 : t1;
    }),

    // child(a) ⋀ child(b) ⟶ child(a ⋀ b)
    // next(a) ⋀ next(b) ⟶ next(a ⋀ b)
    rewriteTermPairs( function (t1,t2) {
        return t1.type === 'fn' && t2.type === 'fn' &&
            (t1.fn === 'child' || t1.fn === 'next') && t2.fn === t1.fn;
    }, function (t1, t2) {
        return builder.createFn( t1.fn, t1.arg.and(t2.arg) );
    }),
];

module.exports = normal;
