// slx - Manipulate selector expressions using predicate logic.

var _ = require('lodash');
var slick = require('slick');

// Constructor, internal use
function Slx ( sumOfProducts ) {
    this.rep = sumOfProducts;
    // TODO: normalize here?
};

function slx ( selectorString ) {
    if ( _.isObject(selectorString) && selectorString instanceof Slx ) {
        return selectorString;
    } else {
        return parse( selectorString );
    }
};

Slx.prototype.or = function ( b ) {
    var a = this;
    b = slx(b);

    return new Slx( _.union(a.rep, b.rep) );
}

Slx.prototype.and = function ( b ) {
    var a = this,
        i, j;
    b = slx(b);

    return new Slx( _.flatten( a.rep.map( function (aTerm) {
        return b.rep.map( function (bTerm) {
            return _.union(aTerm, bTerm);
        });
    })));
}

Slx.prototype.toString = function () {
    return this.rep.map( productToCss ).join(',');
}

var cssToType = {
    // only includes literal types (simple selectors)
    '.': 'class',
    '#': 'id',
};

var typeToCss = {
    'class': '.',
    'id': '#',
    'tag': ''
}

var cssToFn = {
    ' ': 'desc',
    '>': 'child',
    '~': 'succ',
    '+': 'next'
};

var fnToCss = {
    'desc': ' ',
    'child': '>',
    'succ': '~',
    'next': '+'
};

function productToCss ( product ) {
    // TODO: what if cannot represent in CSS (e.g., multiple tags)?
    var tags = literalsOfType('tag'),
        ids = literalsOfType('id'),
        classes = literalsOfType('class'),
        // TODO: handle attributes
        // TODO: handle pseudo-classes
        // TODO: handle pseudo-elements
        functions = _(product).filter({type: "fn"}),
        string =  tags.join('') + ids.join('') + classes.join('') || '*';

    if ( !functions.isEmpty() ) {
        // TODO: check for more than one function (cannot represent)
        string = productToCss( functions.first().arg ) +
            fnToCss[ functions.first().fn ] + string;
    }

    return string;

    function literalsOfType( type ) {
        var prefix = typeToCss[type]
        return _(product).filter({type: type}).map( function (literal) {
            var s = prefix + literal.name;

            return literal.negate ? ':not(' + s + ')' : s;
        });
    }
}

function idToCss ( id ) {
    return '#' + id;
}

function classToCss ( classname ) {
    return '.' + classname;
}

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
    var product = [];

    function literal(type, name) {
        product.push( createLiteral( type, name ) );
    }

    obj.tag && (obj.tag !== '*') && literal('tag', obj.tag);

    obj.id && literal('id', obj.id);

    obj.classList && obj.classList.forEach( function (classname) {
        literal('class', classname);
    });

    obj.pseudos && obj.pseudos.forEach( function (pseudo) {
        switch (pseudo.name) {
            case 'not':
                product.push( parseLiteral( pseudo.value, true ) );
                break;
            default:
            // TODO: implement other pseudo-class selectors
        }
    });

    // TODO: implement attribute selectors
    // TODO: implement pseudo-element selectors

    if ( argument ) {
        product.push( createFn( cssToFn[obj.combinator], argument ) );
    }

    return product;
}

function parseLiteral( value, negate ) {
    // We could use slick to parse the value, but when we know it's a literal, it's easier this way.
    var type = cssToType[ value[0] ];

    if ( type ) {
        value = value.substr(1);
    } else {
        type = 'tag';
    }

    return createLiteral( type, value, negate );
}

// Symbol Table, unique object for each literal so === works to compare

var symTable = {};
var TOP = createLiteral( 'tag', '*' );
var NIL = createLiteral( 'tag', '*', true )

function createLiteral(type, name, negate) {
    negate = !!negate;
    var key = (negate ? '!' : '') + type + '|' + name,
        lookup = symTable[key];

    if ( !lookup ) {
        lookup = symTable[key] = {type: type, name: name, negate: negate};
    }

    return lookup;
}

function createFn(fn, arg) {
    return {type: 'fn', fn: fn, arg: arg};
}

module.exports = slx;
