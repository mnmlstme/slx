var _ = require('lodash');

var typeToCss = {
    'class': '.',
    'id': '#',
    'tag': '',
    'attr': '[',
    'pseudo': ':',
    'universal': '*'
}

var fnToCss = {
    'desc': ' ',
    'child': '>',
    'succ': '~',
    'next': '+',
    'before': '::before',
    'after': '::after',
    // these are not CSS, we need a more general notation to express them
    'desc*': '>>',
    'succ*': '++',

};

function toString () {
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
        f = functions.first(),
        string =  universals + tags + ids + classes + attrs + pseudos || '*';

    if ( !functions.isEmpty() ) {
        if ( functions.length > 1 ) {
            throw "CSS cannot express more than one function";
        }
        switch ( f.fn ) {
          case 'before':
          case 'after':
            if ( string !== '*' ) {
                throw "CSS cannot express predicates on ::" + f.fn;
            }
            string = '';
            break;
          default:
        }

        if ( !fnToCss[ f.fn ] ) {
            throw "CSS cannot express combinator function " + f.fn;
        }

        string = productToCss( f.arg ) + fnToCss[ f.fn ] + string;
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

module.exports = toString;
