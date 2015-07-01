var slx = require('../index');

var DEFER = true;

describe("logical implication", function () {
    var a = slx('.a'),
        b = slx('.b'),
        ab = slx('.a.b'),
        aORb = slx('.a,.b');

    it("proves a -> a", function () {
        expect(a.implies(a).always()).toBe(true);
    });
    it("proves ab -> a and ab -> b", function () {
        expect(ab.implies(a).always()).toBe(true);
        expect(ab.implies(b).always()).toBe(true);
    });
    it("proves a -> a OR b and b -> a OR b", function () {
        expect(a.implies(aORb).always()).toBe(true);
        expect(b.implies(aORb).always()).toBe(true);
    });
    it("proves ab -> ba", function () {
        expect(ab.implies(slx('.b.a')).always()).toBe(true);
    });
    it("proves a:hover -> a and a:hover -> :hover", function () {
        expect(slx('.a:hover').implies(slx('.a')).always()).toBe(true);
        expect(slx('.a:hover').implies(slx(':hover')).always()).toBe(true);
    });
    it("proves a>b -> b and a>b -> a>*", function () {
        expect(slx('.a>.b').implies(slx('.b')).always()).toBe(true);
        expect(slx('.a>.b').implies(slx('.a>*')).always()).toBe(true);
        expect(slx('ul>li').implies(slx('li')).always()).toBe(true);
        expect(slx('ul>li').implies(slx('ul>*')).always()).toBe(true);
        expect(slx('ul.a>li.b').implies(slx('.a>.b')).always()).toBe(true);
    });
    it("proves a b -> b and a b -> a *", function () {
        expect(slx('.a .b').implies(slx('.b')).always()).toBe(true);
        expect(slx('.a .b').implies(slx('.a *')).always()).toBe(true);
    });
    it("proves a>b -> a b", function () {
        expect(slx('.a>.b').implies(slx('.a .b')).always()).toBe(true);
    });
    it("proves a+b -> a~b", function () {
        expect(slx('.a+.b').implies(slx('.a~.b')).always()).toBe(true);
    });


});
