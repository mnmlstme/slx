function implies ( b ) {
    var a = this;

    return a.not().or(b);
}

module.exports = implies;
