var _ = require('lodash');
var builder = require('./builder');

// normalize expressions using term rewriting

function normalize ( original ) {
    return normalizeProducts( original );
    // TODO: also normalize at the sum level
}

function normalizeProducts ( originalSum ) {
    return originalSum.map( function (original) {
        var result = original,
            applied;

        do {
            applied = false;
            productRules.forEach( function (rule) {
                var applicable;
                do {
                    applicable = rule(result);

                    if( applicable ) {
                        applied = true;
                        result = applicable(result);
                    }
                } while(applicable);
            });
        } while ( applied );

        return result;
    });
}

function rewriteTermPairs( matchFn, rewriteFn ) {
    return function (product) {
        var m = findPair( product, matchFn );
        if ( m ) {
            return function (product) {
                return rewriteFn(product, m.t1, m.t2, m.i1, m.i2);
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

    // a ⋀ a ⟶ a
    rewriteTermPairs( function (t1,t2) {
        return t2 === t1;
    }, function (product, t1, t2, i1, i2) {
        return _.reject( product, function (t, i) {
            return i === i2;
        });
    }),

    // a ⋀ ¬a ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type !== 'fn' &&
            t2 === builder.createLiteral( t1.type, t1, true );
    }, function () {
        return [builder.BOTTOM];
    }),

    // tag:a ⋀ tag:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'tag' && t2.type === 'tag' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return [builder.BOTTOM];
    }),

    // id:a ⋀ id:b ⟶ ⊥
    rewriteTermPairs( function (t1, t2) {
        return t1.type === 'id' && t2.type === 'id' &&
            !t1.negate && !t2.negate && t1.name !== t2.name;
    }, function () {
        return [builder.BOTTOM];
    }),

    // child(a) ⋀ child(b) ⟶ child(a ⋀ b)
    rewriteTermPairs( function (t1,t2) {
        return t1.type === 'fn' && t2.type === 'fn' &&
            t2.fn === 'child' && t2.fn === 'child';
    }, function (product, t1, t2, i1, i2) {
        var arg = _.union(t1.arg, t2.arg),
            result = _.reject( product, function (t, i) {
                return i === i1 || i === i2;
            });
        result.push( builder.createFn( 'child', arg ) );
        return result;
    }),

    // order terms lexicographically
    function (product) {
        var sorted = _.sortBy( product, termOrder );
        return ! _.isEqual( product, sorted ) && function () {
            return sorted;
        }
    }
];

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

module.exports = normalize;
