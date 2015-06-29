var _ = require('lodash');
var builder = require('./builder');
var Slx = require('./constructor');

var MAX_REWRITE_ITERATIONS = 10;
var MAX_SUM_ITERATIONS = 10;
var MAX_SUM_RULE_ITERATIONS = 10;
var MAX_PRODUCT_ITERATIONS = 10;
var MAX_PRODUCT_RULE_ITERATIONS = 10;

// normalize expressions using term rewriting
function normal () {
    var original = this;

    return original.normalized ? original :
        new Slx( normalize( original.sop ), true );
}

function normalize ( originalSum ) {
    var sum = originalSum,
        iteration = 0,
        priorSum;

    do {
        priorSum = sum;
        for ( var i = 0; i < sum.length; i++ ) {
            sum = applyAllProductRules(sum, i);
        }

        if ( sum.length > 1 && (iteration === 0 || sum !== priorSum) ) {
            sum = applyAllSumRules( sum );
        }

        if ( sum !== priorSum && iteration++ > MAX_REWRITE_ITERATIONS ) {
            throw "rewrite loop exceeded max iterations";
        }
    } while( sum !== priorSum );

    return sum;
}

function applyAllProductRules ( originalSum, i ) {
    var sum = originalSum,
        iteration = 0,
        priorSum,
        sorted;

    do {
        sorted = _.sortBy( sum[i], termOrder );
        if ( !productsEqual( sorted, sum[i] ) ) {
            sum = sum.slice();
            sum[i] = sorted;
        }

        priorSum = sum;

        productRules.forEach( function (rule) {
            sum = applyProductRule( sum, i, rule );
        });

        if ( sum !== priorSum && iteration++ > MAX_PRODUCT_ITERATIONS ) {
            throw "product rewrite loop exceeded max iterations";
        }

    } while ( sum !== priorSum );

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
            if ( iteration++ > MAX_PRODUCT_RULE_ITERATIONS )  {
                throw "product rule loop exceeded max iterations";
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

function applyAllSumRules ( originalSum ) {
    var sum = originalSum,
        iteration = 0,
        priorSum;

    do {
        priorSum = sum;
        sumRules.forEach( function (rule) {
            sum = applySumRule( sum, rule );
        });

        if ( priorSum !== sum && iteration++ > MAX_SUM_ITERATIONS ) {
            throw "sum rewrite loop exceeded max iterations";
        }
    } while ( sum !== priorSum );

    // TODO: sort products in sum

    return sum;
}

function applySumRule ( originalSum, rule ) {
    var sum = originalSum,
        iteration = 0,
        rewrite;

    do {
        rewrite = rule(sum);

        if( rewrite ) {
            if ( iteration++ > MAX_SUM_RULE_ITERATIONS )  {
                throw "sum rule loop exceeded max iterations";
            }

            sum = rewrite(sum);
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
    return typeOrder[t.type] + t.name + (t.negate ? '-' : '+');
}

function rewriteSum( matchFn, rewriteFn ) {
    return function (sum) {
        var m = findProductPair( sum, matchFn );
        if ( m ) {
            return function (sum) {
                var others = _.reject( sum, function (p, i) {
                    return i === m.i1 || i === m.i2;
                }),
                rewritten = rewriteFn(m.p1, m.p2, m.bound);

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
                    rewritten = rewriteFn(m.t, m.bound);

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
                    rewritten = rewriteFn(m.t1, m.t2, m.bound);

                return rewritten.map( function (product) {
                    return _.union( others, product );
                });
            };
        }
    }
}

function findTerm ( product, matchFn ) {
    var i, bound;
    for ( i = 0; i < product.length; i++ ) {
        bound = matchFn( product[i] );
        if ( bound ) {
            return {
                t: product[i], i: i,
                bound: bound
            };
        }
    }
}

function findPair ( product, matchFn ) {
    var i, j, bound;
    for ( i = 0; i < product.length; i++ ) {
        for ( j = i+1; j < product.length; j++ ) {
            bound = matchFn( product[i], product[j] );
            if ( bound ) {
                return {
                    t1: product[i], i1: i,
                    t2: product[j], i2: j,
                    bound: bound
                };
            }
        }
    }
}

function findProductPair ( sum, matchFn ) {
    var i, j, bound;
    for ( i = 0; i < sum.length; i++ ) {
        for ( j = i+1; j < sum.length; j++ ) {
            bound = matchFn( sum[i], sum[j] );
            if ( bound ) {
                return {
                    p1: sum[i], i1: i,
                    p2: sum[j], i2: j,
                    bound: bound
                }
            }
        }
    }
}

function productsEqual ( a, b ) {
    var mismatch = a.length !== b.length;

    for ( var i = 0; !mismatch && i < a.length && i < b.length; i++ ) {
        // TODO: equality for functions
        mismatch = a[i] !== b[i];
    }

    return !mismatch;
}

function productsHaveOneMismatch ( a, b ) {
    var mismatch = false;

    for ( var i = 0; i < a.length && i < b.length; i++ ) {
        // TODO: equality for functions
        if ( a[i] !== b[i] ) {
            if ( mismatch ) {
                return false;
            }
            mismatch = [a[i], b[i]];
        }
    }

    return mismatch;
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
            t.arg.sop.length > 1;
    }, function (t) {
        var sum = t.arg.sop.map( function (product) {
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
    // a ⋁ ⊤ ⟶ ⊤
    // ⊤ ⋁ a ⟶ ⊤
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, [builder.TOP] ) ||
            productsEqual( p2, [builder.TOP] );
    }, function () {
        return [[builder.TOP]];
    }),

    // a ⋁ ⊥ ⟶ a
    // ⊥ ⋁ a ⟶ a
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, [builder.BOTTOM] ) ||
            productsEqual( p2, [builder.BOTTOM] );
    }, function () {
        return productsEqual( p1, [builder.BOTTOM] ) ? [p2] : [p1];
    }),

    // a ⋁ a ⟶ a
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, p2 );
    }, function (p1, p2) {
        return [p1];
    }),
    // a ⋁ ¬a ⟶ ⊤
    // ab ⋁ ¬ab ⟶ b
    rewriteSum( function (p1, p2) {
        var terms = productsHaveOneMismatch( p1, p2 ),
            a1 = terms && terms[0],
            a2 = terms && terms[1];
        return terms && a1 === builder.invertTerm( a2 ) && terms;
    }, function (p1, p2, terms) {
        var b = p1.length === 1 ? [builder.TOP] :
                _.reject( p1, function (t) {
                    return t === terms[0];
                });
        return [b];
    })

];

module.exports = normal;
