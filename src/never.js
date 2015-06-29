var builder = require('./builder');

function never () {
    var a = this.normal(),
        sop = a.sop;

    return sop.length === 1 && sop[0].length === 1 &&
        sop[0][0] === builder.BOTTOM;
};

module.exports = never;
