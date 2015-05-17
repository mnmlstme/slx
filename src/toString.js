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

module.exports = toString;
