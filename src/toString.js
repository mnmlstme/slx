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
    'after': '::after'
};

function toString () {
    return this.sop.map( productToCss ).join(',');
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
        string =  universals + tags + ids + classes + attrs + pseudos || '*',
        arg;

    if ( !functions.isEmpty() ) {
        if ( functions.size() > 1 ) {
            throw "CSS cannot express more than one function";
        }
        if ( f.fn === 'before' || f.fn === 'after' ) {
            if ( string !== '*' ) {
                throw "CSS cannot express predicates on " + fnToCss[ f.fn ];
            }
            string = '';
        }

        if ( !fnToCss[ f.fn ] ) {
            throw "CSS cannot express combinator function " + f.fn;
        }

        arg = f.arg.toString();

        if ( f.arg.sop.length > 1 ) {
            throw "CSS cannot express a sum as a function argument";
            arg = '(' + arg + ')';
        }

        if (f.negate) {
            // CSS4
            string = (string === '*' ? '' : string ) +
                ':not(' + arg + fnToCss[ f.fn ] + '*)';
        } else {
            string = arg + fnToCss[ f.fn ] + string;
        }
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
