var _ = require('lodash');

// Symbol Table, unique object for each literal so === works to compare
var symTable = {};

var TOP = createLiteral( 'universal', '' );
var BOTTOM = createLiteral( 'universal', '', true );

function createLiteral (type, nameOrObject, invert) {
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

function createFn (fn, arg, negate) {
    return {type: 'fn', fn: fn, arg: arg, negate: negate};
}

function isTerm ( sop ) {
    return sop.length === 1 && sop[0].length === 1;
}

function isSum ( sop ) {
    return sop.length > 1;
}

function isProduct ( sop ) {
    return sop.length === 1 && sop[0].length > 1;
}

module.exports = {
    TOP: TOP,
    BOTTOM: BOTTOM,
    createLiteral: createLiteral,
    createFn: createFn,
    isTerm,
    isSum,
    isProduct
};
