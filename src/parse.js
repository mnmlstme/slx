var _ = require('lodash');
var slick = require('slick');
var Slx = require('./constructor');

var cssToFn = {
    ' ': 'desc',
    '>': 'child',
    '~': 'succ',
    '+': 'next'
};

/** slick.parse returns a structure like this:
[[
    { "combinator":" ", "tag":"*", "id":"foo" },
    { "combinator":">", "tag":"li", "classList": ["baz"] }
], [
    ...
]]

This is essentially a sum of products form, where each selector is a product term.  We make this more
obvious (and convenient to operate on) by converting each selector (the inner array) to a product of
predicates, where combinators are function predicates.

[[
    { type: "tag", arg: "bar" },
    { type: "class", arg: "baz" },
    { type: "fn", fn: "child", arg: [{type: "id", value: "foo" }]
],[
]
**/

function parse ( selectorString ) {
    var selectors = slick.parse( selectorString );

    return new Slx( _.map(selectors, convertSlickSelector ) );
}

function convertSlickSelector( levels ) {
    var result;

    for ( i = 0; i < levels.length; i++ ) {
        result = convertSlickLevel( levels[i], result );
    }

    return result;
}

function convertSlickLevel( obj, argument ) {
    var product = [],
        pseudoElement;

    function literal(type, name ) {
        product.push( Slx.createLiteral( type, name ) );
    }

    obj.tag && (obj.tag !== '*') && literal('tag', obj.tag);

    obj.id && literal('id', obj.id);

    obj.classList && obj.classList.forEach( function (classname) {
        literal('class', classname);
    });

    obj.attributes && obj.attributes.forEach( function (attr) {
        literal('attr', { name: attr.name, op: attr.operator, value: attr.value });
    });

    obj.pseudos && obj.pseudos.forEach( function (pseudo) {
        if ( pseudo.type === 'element' ) {
            pseudoElement = pseudo;
        } else {
            switch (pseudo.name) {
              case 'not':
                product.push( parseLiteral( pseudo.value, true ) );
                break;
              default:
                // TODO: implement pseudo-classes with parameters, e.g., nth-child()
                literal( 'pseudo', pseudo.name );
                break;
            }
        }
    });

    if ( argument ) {
        product.push( Slx.createFn( cssToFn[obj.combinator], argument ) );
    }

    // pseudo-elements are really combinator functions, like child()
    if ( pseudoElement ) {
        product = [ Slx.createFn( pseudoElement.name, product ) ];
    }

    // An empty product is the top (* selector)
    if ( !product.length ) {
        product = Slx.TOP.rep[0];
    }

    return product;
}

function parseLiteral( name, negate ) {
    var expr = parse(name),
        literal = expr.rep[0][0];

    if ( negate ) {
        literal = Slx.createLiteral( literal.type, literal, negate );
    }

    return literal;
}

module.exports = parse;
