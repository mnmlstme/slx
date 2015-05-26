var _ = require('lodash');

function Slx ( sumOfProducts ) {
    this.rep = sumOfProducts;
    // TODO: normalize here?
};

// Symbol Table, unique object for each literal so === works to compare

var symTable = {};

Slx.createLiteral = function (type, nameOrObject, invert) {
    var nameOpVal = _.isObject(nameOrObject) ? nameOrObject : { name: nameOrObject },
        name = nameOpVal.name,
        op = nameOpVal.op || '',
        value = nameOpVal.value || '',
        negate = (nameOpVal.negate || false) === !invert,
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

Slx.createFn = function (fn, arg) {
    return {type: 'fn', fn: fn, arg: arg};
}

Slx.TOP = new Slx( [[Slx.createLiteral( 'universal', '' )]] );
Slx.BOTTOM = new Slx( [[Slx.createLiteral( 'universal', '', true )]] );

module.exports = Slx;
