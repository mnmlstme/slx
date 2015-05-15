// slx - Manipulate selector expressions using predicate logic.

var _ = require('lodash');
var slick = require('slick');

var cssToType = {
    // only includes literal types (simple selectors)
    '.': 'class',
    '#': 'id',
    '[': 'attr',
    ':': 'pseudo',
    '*': 'universal'
};

var typeToCss = {
    'class': '.',
    'id': '#',
    'tag': '',
    'attr': '[',
    'pseudo': ':',
    'universal': '*'
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
    'next': '+',
    'before': '::before',
    'after': '::after'
};

// Symbol Table, unique object for each literal so === works to compare

var symTable = {};
var TOP = createLiteral( 'universal', '' );
var BOTTOM = createLiteral( 'universal', '', true )

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
            return _.union( aTerm, bTerm);
        });
    })));
}

Slx.prototype.toString = function () {
    return this.rep.map( productToCss ).join(',');
}

function productToCss ( product ) {
    // TODO: check multiple tags or ids (invalid)
    var universals = literalsOfType('universal'),
        tags = literalsOfType('tag'),
        ids = literalsOfType('id'),
        classes = literalsOfType('class'),
        attrs = literalsOfType('attr'),
        pseudos = literalsOfType('pseudo'),
        // TODO: handle pseudo-classes with parameters, e.g., nth-child()
        functions = _(product).filter({type: "fn"}),
        string =  universals + tags + ids + classes + attrs + pseudos || '*';

    if ( !functions.isEmpty() ) {
        // TODO: check for more than one function (invalid)

        switch ( functions.first().fn ) {
          case 'before':
          case 'after':
            // TODO: check for any other predicates w/ ::after or ::before (invalid)
            string = '';
            break;
          default:
        }

        string = productToCss( functions.first().arg ) +
            fnToCss[ functions.first().fn ] + string;
    }

    return string;

    function literalsOfType( type ) {
        var prefix = typeToCss[type],
            suffix = type === 'attr' ? ']' : '';

        return _(product).filter({type: type}).map( function (literal) {
            // TODO: escape the value?
            var opValue = literal.op ? literal.op + '"' + literal.value + '"' : '',
                s = prefix + literal.name + opValue + suffix;
            return literal.negate ? ':not(' + s + ')' : s;
        }).join('');
    }
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
    var product = [],
        pseudoElement;

    function literal(type, name ) {
        product.push( createLiteral( type, name ) );
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
        product.push( createFn( cssToFn[obj.combinator], argument ) );
    }

    // pseudo-elements are really combinator functions, like child()
    if ( pseudoElement ) {
        product = [ createFn( pseudoElement.name, product ) ];
    }

    // An empty product is the top (* selector)
    if ( !product.length ) {
        product.push( TOP );
    }

    return product;
}

function parseLiteral( name, negate ) {
    var expr = parse(name),
        literal = expr.rep[0][0] || TOP;

    if ( negate ) {
        literal = createLiteral( literal.type, literal, negate );
    }

    return literal;
}

function createLiteral(type, nameOrObject, negate) {
    negate = !!negate;
    var nameOpVal = _.isObject(nameOrObject) ? nameOrObject : { name: nameOrObject },
        name = nameOpVal.name,
        op = nameOpVal.op || '',
        value = nameOpVal.value || '',
        key = (negate ? '!' : '') + type + '|' + name + op + value,
        literal = symTable[key];

    if ( !literal ) {
        literal = {type: type, name: name, negate: negate};
        if ( op ) {
            _.extend( literal, {
                op: op,
                value: value
            });
        }
        symTable[key] = literal;
    }

    return literal;
}

function createFn(fn, arg) {
    return {type: 'fn', fn: fn, arg: arg};
}

module.exports = slx;
