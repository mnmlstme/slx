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

    return original.normalized ? original : normalize( original );
}

function normalize ( originalSum ) {
    var sum = originalSum,
        iteration = 0,
        priorSum;

    do {
        priorSum = sum;
        for ( var i = 0; i < sum.sop.length; i++ ) {
            sum = applyAllProductRules( sum );
        }

        if ( sum.sop.length > 1 && (iteration === 0 || sum !== priorSum) ) {
            sum = applyAllSumRules( sum );
        }

        if ( sum !== priorSum && iteration++ > MAX_REWRITE_ITERATIONS ) {
            throw "rewrite loop exceeded max iterations";
        }
    } while( sum !== priorSum );

    sum.normalized = true;
    return sum;
}

function applyAllProductRules ( originalSum ) {
    var sum = originalSum,
        iteration = 0;

    productRules.forEach( function (rule) {
        sum = _(sum.sop).map( function ( productArray ) {
            return applyProductRule( new Slx([productArray]), rule );
        }).reduce( function (a, b) {
            return new Slx( _.union(a.sop, b.sop) );
        });
    });

    sum = new Slx( sum.sop.map( function (productArray) {
        return _.sortBy( productArray, termOrder );
    }));

    return sumsEqual( sum.sop, originalSum.sop ) ? originalSum : sum;
}

function applyProductRule ( product, rule ) {
    var iteration = 0,
        rewrite,
        rewritten,
        newProducts = [];

    do {
        rewrite = rule(product);

        if( rewrite ) {
            if ( iteration++ > MAX_PRODUCT_RULE_ITERATIONS )  {
                throw "product rule loop exceeded max iterations";
            }
            rewritten = rewrite(product);
            product = new Slx( [rewritten.sop.shift()] );
            newProducts = _.union(newProducts, rewritten.sop);
        }
    } while( rewrite );

    return newProducts.length ? new Slx(_.union(product.sop, newProducts)) : product;
}

function applyAllSumRules ( originalSum ) {
    var sum = originalSum,
        iteration = 0;

    sumRules.forEach( function (rule) {
        var rewrite = rule(sum);
        do {
            rewrite = rule(sum);

            if( rewrite ) {
                if ( iteration++ > MAX_SUM_RULE_ITERATIONS )  {
                    throw "sum rule loop exceeded max iterations";
                }
                sum = rewrite(sum);
            }
        } while( rewrite );
    });

    sum = new Slx(_.sortBy(sum.sop, productOrder));

    return sumsEqual( sum.sop, originalSum.sop ) ? originalSum : sum;
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

function productOrder (p) {
    return p.map( termOrder ).join('*');
}

function rewriteSum( matchFn, rewriteFn ) {
    return function (sum) {
        var m = findProductPair( sum, matchFn );
        if ( m ) {
            return function (sum) {
                var others = new Slx(_.reject( sum.sop, function (p, i) {
                    return i === m.i1 || i === m.i2;
                })),
                rewritten = rewriteFn(m.p1, m.p2, m.bound);

                return rewritten.or(others);
            }
        }
    }
}

function rewriteTerms( matchFn, rewriteFn ) {
    return function (product) {
        var m = findTerm( product, matchFn );
        if ( m ) {
            return function (product) {
                var others = new Slx([_.reject( product.sop[0], function (t, i) {
                        return i === m.i;
                    })]),
                    rewritten = rewriteFn(m.t, m.bound);

                return rewritten.and(others);
            };
        }
    }
}

function rewriteTermPairs( matchFn, rewriteFn ) {
    return function (product) {
        var m = findPair( product, matchFn );
        if ( m ) {
            return function (product) {
                var others = new Slx([_.reject( product.sop[0], function (t, i) {
                        return i === m.i1 || i === m.i2;
                    })]),
                    rewritten = rewriteFn(m.t1, m.t2, m.bound);

                return rewritten.and(others);
            };
        }
    }
}

function findTerm ( product, matchFn ) {
    var productArray = product.sop[0],
        i, bound;
    for ( i = 0; i < productArray.length; i++ ) {
        bound = matchFn( productArray[i] );
        if ( bound ) {
            return {
                t: productArray[i], i: i,
                bound: bound
            };
        }
    }
}

function findPair ( product, matchFn ) {
    var productArray = product.sop[0],
        i, j, bound;
    for ( i = 0; i < productArray.length; i++ ) {
        for ( j = i+1; j < productArray.length; j++ ) {
            bound = matchFn( productArray[i], productArray[j] );
            if ( bound ) {
                return {
                    t1: productArray[i], i1: i,
                    t2: productArray[j], i2: j,
                    bound: bound
                };
            }
        }
    }
}

function findProductPair ( sum, matchFn ) {
    var sumArray = sum.sop,
        i, j, bound;
    for ( i = 0; i < sumArray.length; i++ ) {
        for ( j = i+1; j < sumArray.length; j++ ) {
            bound = matchFn( sumArray[i], sumArray[j] );
            if ( bound ) {
                return {
                    p1: sumArray[i], i1: i,
                    p2: sumArray[j], i2: j,
                    bound: bound
                }
            }
        }
    }
}

function sumsEqual ( a, b ) {
    var mismatch = a.length !== b.length;

    for ( var i = 0; !mismatch && i < a.length && i < b.length; i++ ) {
        mismatch = !productsEqual(a[i], b[i]);
    }

    return !mismatch;
}

function productsEqual ( a, b ) {
    var mismatch = a.length !== b.length;

    for ( var i = 0; !mismatch && i < a.length && i < b.length; i++ ) {
        mismatch = !termsEqual(a[i], b[i]);
    }

    return !mismatch;
}

function productsHaveOneMismatch ( a, b ) {
    var mismatch = false;

    if ( a.length !== b.length ) {
        return false;
    }

    for ( var i = 0; i < a.length && i < b.length; i++ ) {
        if ( !termsEqual(a[i], b[i]) ) {
            if ( mismatch ) {
                return false;
            }
            mismatch = [a[i], b[i]];
        }
    }

    return mismatch;
}

function termsEqual ( a, b ) {
    return a === b ||
        a.type === 'fn' && b.type === 'fn' && a.fn === b.fn &&
        !!a.negate === !!b.negate && sumsEqual( a.arg.sop, b.arg.sop );
}

function rejectTerm ( p, t ) {
    return _.reject( p, function (x) { return termsEqual( x, t ); } );
}

function productContainsTerm ( p, t ) {
    return _.find(p, function (x) { return termsEqual( x, t ); });
}

var rules = [
    {
        // ¬child(a) ⟶ child(¬a)
        name: 'negated child function',
        template: [[ { type: 'fn', fn: 'child', negate: true, assignArg: 'a' } ]],
        rewrite: function (match) {
            var a = match.a;
            return new Slx([[builder.createFn('child', a.not())]]);
        }
    },
    {
        // ¬next(a) ⟶ next(¬a)
        name: 'negated next function',
        template: [[ { type: 'fn', fn: 'next', negate: true, assignArg: 'arg' } ]],
        rewrite: function (match) {
            var arg = match.arg;
            return new Slx([[builder.createFn('next', a.not())]]);
        }
    },
    {
        // child(a ⋀ b) ⟶ child(a) ⋀ child(b)
        name: 'conjunction in child function',
        template: [[ { type: 'fn', fn: 'next', negate: false, assignArg: 'arg' } ]],
        condition: function (match) {
            var arg = match.arg;
        }
    }
];

var productRules = [

    // ¬child(a) ⟶ child(¬a)
    // ¬next(a) ⟶ next(¬a)
    rewriteTerms( function (t) {
        return t.type === 'fn' && t.negate && (t.fn === 'child' || t.fn === 'next');
    }, function (t) {
        return new Slx([[builder.createFn(t.fn, t.arg.not())]]);
    }),

    // child(a ⋁ b) ⟶ child(a) ⋁ child(b)
    // next(a ⋁ b) ⟶ next(a) ⋁ next(b)
    rewriteTerms( function (t) {
        return t.type === 'fn' && !t.negate && (t.fn === 'child' || t.fn === 'next') &&
            t.arg.sop.length > 1;
    }, function (t) {
        var sum = t.arg.sop.map( function (product) {
            return [builder.createFn(t.fn, new Slx([product]))];
        });
        return new Slx(sum);
    }),

    // a ⋀ a ⟶ a
    rewriteTermPairs( function (t1,t2) {
        return termsEqual(t1, t2);
    }, function (t1) {
        return new Slx([[t1]]);
    }),

    // a ⋀ ¬a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type !== 'fn' && termsEqual( builder.invertTerm(t2), t1 );
    }, function () {
        return new Slx([[builder.BOTTOM]]);
    }),

    // tag:a ⋀ tag:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'tag' && t2.type === 'tag' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return new Slx([[builder.BOTTOM]]);
    }),

    // id:a ⋀ id:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'id' && t2.type === 'id' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return new Slx([[builder.BOTTOM]]);
    }),
    // a ⋀ ⊥ ⟶ ⊥
    // ⊥ ⋀ a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.BOTTOM || t2 === builder.BOTTOM;
    }, function () {
        return new Slx([[builder.BOTTOM]]);
    }),

    // a ⋀ ⊤ ⟶ a
    // ⊤ ⋀ a ⟶ a
    rewriteTermPairs( function (t1, t2) {
        return t1 === builder.TOP || t2 === builder.TOP;
    }, function (t1, t2) {
        return new Slx(t1 === builder.TOP ? [[t2]] : [[t1]]);
    }),

    // child(a) ⋀ child(b) ⟶ child(a ⋀ b)
    // next(a) ⋀ next(b) ⟶ next(a ⋀ b)
    rewriteTermPairs( function (t1,t2) {
        return t1.type === 'fn' && t2.type === 'fn' &&
            (t1.fn === 'child' || t1.fn === 'next') && t2.fn === t1.fn;
    }, function (t1, t2) {
        return new Slx([[builder.createFn( t1.fn, t1.arg.and(t2.arg) )]]);
    }),

    // child(a) ⋀ desc(a) ⟶ child(a)
    // next(a) ⋀ succ(a) ⟶ next(a)
    rewriteTermPairs( function (t1,t2) {
        return t1.type === 'fn' && t2.type === 'fn' &&
            (t1.fn === 'child' && t2.fn === 'desc' ||
             t1.fn === 'desc' && t2.fn === 'child' ||
             t1.fn === 'next' && t2.fn === 'succ' ||
             t1.fn === 'succ' && t2.fn === 'next' ) &&
             sumsEqual(t2.arg.sop, t1.arg.sop);
    }, function (t1, t2) {
        return new Slx((t1.fn === 'child' || t1.fn === 'next') ? [[t1]] : [[t2]]);
    })

];

sumRules = [
    // a ⋁ ⊤ ⟶ ⊤
    // ⊤ ⋁ a ⟶ ⊤
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, [builder.TOP] ) ||
            productsEqual( p2, [builder.TOP] );
    }, function () {
        return new Slx([[builder.TOP]]);
    }),

    // a ⋁ ⊥ ⟶ a
    // ⊥ ⋁ a ⟶ a
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, [builder.BOTTOM] ) ||
            productsEqual( p2, [builder.BOTTOM] );
    }, function () {
        return new Slx(productsEqual( p1, [builder.BOTTOM] ) ? [p2] : [p1]);
    }),

    // a ⋁ a ⟶ a
    rewriteSum( function (p1, p2) {
        return productsEqual( p1, p2 );
    }, function (p1, p2) {
        return new Slx([p1]);
    }),

    // a ⋁ ¬a ⟶ ⊤
    // ab ⋁ ¬ab ⟶ b
    rewriteSum( function (p1, p2) {
        var terms = productsHaveOneMismatch( p1, p2 ),
            a1 = terms && terms[0],
            a2 = terms && terms[1];
        return terms && termsEqual(a2, builder.invertTerm(a1)) && terms;
    }, function (p1, p2, terms) {
        return new Slx([ p1.length > 1 ? rejectTerm( p1, terms[0] ) : [builder.TOP] ]);
    }),

    // ab ⋁ ¬b ⟶ a ⋁ ¬b
    // ¬a ⋁ ab ⟶ ¬a ⋁ b
    rewriteSum( function (p1, p2) {
        var t1, t2;
        if ( p1.length > 1 && p2.length === 1 ) {
            t2 = p2[0];
            t1 = builder.invertTerm(t2);
            return productContainsTerm( p1, t1 ) && [t1,null];
        } else if ( p1.length === 1 && p2.length > 1 ) {
            t1 = p1[0];
            t2 = builder.invertTerm(t1);
            return productContainsTerm( p2, t2 ) && [null,t2];
        } else {
            return false;
        }
    }, function (p1, p2, terms) {
        return new Slx([ rejectTerm( p1, terms[0] ), rejectTerm( p2, terms[1] ) ]);
    }),

    // b·child(a) ⋁ b·desc(a) ⟶ b·desc(a)
    // b·next(a) ⋁ b·succ(a) ⟶ b·succ(a)
    rewriteSum( function (p1, p2) {
        var terms = productsHaveOneMismatch( p1, p2 ),
            t1 = terms && terms[0],
            t2 = terms && terms[1];
        return terms && t1.type === 'fn' && t2.type === 'fn' &&
            ( t1.fn === 'child' && t2.fn === 'desc' ||
              t1.fn === 'desc' && t2.fn === 'child' ||
              t1.fn === 'next' && t2.fn === 'succ' ||
              t1.fn === 'succ' && t2.fn === 'next' ) &&
            sumsEqual( t1.arg.sop, t2.arg.sop ) && terms;
    }, function (p1, p2, terms) {
        return new Slx([(terms[0].fn === 'desc' || terms[0].fn === 'succ') ? p1 : p2]);
    }),

    // b·child(¬a) ⋁ b·desc(a) ⟶ b
    // b·next(¬a) ⋁ b·succ(a) ⟶ b
    rewriteSum( function (p1, p2) {
        var terms = productsHaveOneMismatch( p1, p2 ),
            t1 = terms && terms[0],
            t2 = terms && terms[1];
        return terms && t1.type === 'fn' && t2.type === 'fn' &&
            ( t1.fn === 'child' && t2.fn === 'desc' ||
              t1.fn === 'desc' && t2.fn === 'child' ||
              t1.fn === 'next' && t2.fn === 'succ' ||
              t1.fn === 'succ' && t2.fn === 'next' ) &&
            sumsEqual( t1.arg.sop, t2.arg.not().sop ) && terms;
    }, function (p1, p2, terms) {
        return new Slx([ p1.length > 1 ? rejectTerm( p1, terms[0] ) : [builder.TOP] ]);
    })
];

module.exports = normal;
