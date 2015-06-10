var _ = require('lodash');
var builder = require('./builder');
var Slx = require('./constructor');

var MAX_SUM_ITERATIONS = 10;
var MAX_PRODUCT_ITERATIONS = 10;
var MAX_RULE_ITERATIONS = 10;

// normalize expressions using term rewriting

function normal () {
    var original = this;

    return original.normalized ? original :
        new Slx( normalize( original.rep ), true );
}

function normalize ( originalSum ) {
    var sum = normalizeProducts ( originalSum );

    return sum;
}

function normalizeProducts ( originalSum ) {
    var sum = originalSum;

    for ( var i = 0; i < sum.length; i++ ) {
        sum = applyAllProductRules(sum, i);
    }

    return sum;
}

function applyAllProductRules ( originalSum, i ) {
    var sum = originalSum,
        iteration = 0,
        priorSum;

    do {
        if ( iteration++ > MAX_PRODUCT_ITERATIONS ) {
            throw "product rewrite loop exceeded max iterations";
        }

        priorSum = sum;
        productRules.forEach( function (rule) {
            sum = applyProductRule( sum, i, rule );
        });

    } while ( sum !== priorSum );

    if ( sum !== originalSum ) {
        sum[i] = _.sortBy( sum[i], termOrder );
    }

    return sum;
}

function applyProductRule ( originalSum, i, rule ) {
    var sum = originalSum,
        product = sum[i],
        iteration = 0,
        rewrite,
        rewritten;

    do {
        rewrite = rule(product);

        if( rewrite ) {
            if ( iteration++ > MAX_RULE_ITERATIONS )  {
                throw "term rewrite loop exceeded max iterations";
            }

            rewritten = rewrite(product);
            product = rewritten.shift();
            sum = sum.slice();
            sum.splice(i, 1, product);
            while ( rewritten.length ) {
                sum.push( rewritten.shift() );
            }
        }
    } while( rewrite );

    return sum;
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

function rewriteSum( matchFn, rewriteFn ) {
    return function (sum) {
        var m = findProductPair( sum, matchFn );
        if ( m ) {
            return function (sum) {
                var others = _.reject( sum, function (p, i) {
                    return i === m.i1 || i === m.i2;
                }),
                rewritten = rewriteFn(m.p1, m.p2);

                return _.union( others, rewritten );
            }
        }
    }
}

function rewriteTerms( matchFn, rewriteFn ) {
    return function (product) {
        var m = findTerm( product, matchFn );
        if ( m ) {
            return function (product) {
                var others = _.reject( product, function (t, i) {
                        return i === m.i;
                    }),
                    rewritten = rewriteFn(m.t);

                return rewritten.map( function (product) {
                    return _.union( others, product );
                });
            };
        }
    }
}

function rewriteTermPairs( matchFn, rewriteFn ) {
    return function (product) {
        var m = findPair( product, matchFn );
        if ( m ) {
            return function (product) {
                var others = _.reject( product, function (t, i) {
                        return i === m.i1 || i === m.i2;
                    }),
                    rewritten = rewriteFn(m.t1, m.t2);

                return rewritten.map( function (product) {
                    return _.union( others, product );
                });
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

function productsEqual ( a, b ) {
    var mismatch = a.length !== b.length;

    for ( var i = 0; !mismatch && i < a.length && i < b.length; i++ ){
        mismatch = a[i] !== b[i];
    }

    return !mismatch;
}

var productRules = [

    // ¬child(a) ⟶ child(¬a)
    // ¬next(a) ⟶ next(¬a)
    rewriteTerms( function (t) {
        return t.type === 'fn' && t.negate && (t.fn === 'child' || t.fn === 'next');
    }, function (t) {
        return [[builder.createFn(t.fn, t.arg.not())]];
    }),

    // child(a ⋀ b) ⟶ child(a) ⋀ child(b)
    // next(a ⋀ b) ⟶ next(a) ⋀ next(b)
    rewriteTerms( function (t) {
        return t.type === 'fn' && !t.negate && (t.fn === 'child' || t.fn === 'next') &&
            t.arg.rep.length > 1;
    }, function (t) {
        var sum = t.arg.rep.map( function (product) {
            return [builder.createFn(t.fn, new Slx([product]))];
        });
        return sum;
    }),

    // a ⋀ a ⟶ a
    rewriteTermPairs( function (t1,t2) {
        return t2 === t1;
    }, function (t1) {
        return [[t1]];
    }),

    // a ⋀ ¬a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type !== 'fn' &&
            t2 === builder.createLiteral( t1.type, t1, true );
    }, function () {
        return [[builder.BOTTOM]];
    }),


    // tag:a ⋀ tag:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'tag' && t2.type === 'tag' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return [[builder.BOTTOM]];
    }),

    // id:a ⋀ id:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'id' && t2.type === 'id' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return [[builder.BOTTOM]];
    }),
    // a ⋀ ⊥ ⟶ ⊥
    // ⊥ ⋀ a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.BOTTOM || t2 === builder.BOTTOM;
    }, function () {
        return [[builder.BOTTOM]];
    }),

    // a ⋀ ⊤ ⟶ a
    // ⊤ ⋀ a ⟶ a
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.TOP || t2 === builder.TOP;
    }, function (t1, t2) {
        return t1 === builder.TOP ? [[t2]] : [[t1]];
    }),

    // child(a) ⋀ child(b) ⟶ child(a ⋀ b)
    // next(a) ⋀ next(b) ⟶ next(a ⋀ b)
    rewriteTermPairs( function (t1,t2) {
        return t1.type === 'fn' && t2.type === 'fn' &&
            (t1.fn === 'child' || t1.fn === 'next') && t2.fn === t1.fn;
    }, function (t1, t2) {
        return [[builder.createFn( t1.fn, t1.arg.and(t2.arg) )]];
    }),
];

sumRules = [
    // a ⋁ a ⟶ a
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, p2 );
    }, function (p1, p2) {
        return [p1];
    })
];

module.exports = normal;
