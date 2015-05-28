var slx = require('../index');

var DEFER = true; // skip deferred tests

describe("normalizer as applied thru parser", function () {
    it("eliminates duplicate .class selectors", function () {
        expect(slx(".a.a").toString()).toBe(".a");
    });
    it("cancels .class and :not(.class) selectors", function () {
        expect(slx(".a:not(.a)").toString()).toBe(":not(*)");
    });
    it("returns .class selectors in sorted order", function () {
        expect(slx(".b.a").toString()).toBe(".a.b");
    });
    it("puts ids before classes", function () {
        expect(slx(".a#b").toString()).toBe("#b.a");
    });

    it("normalizes through child selectors", function () {
        expect(slx(".x.a.a > .x.b.b").toString()).toBe(".a.x>.b.x");
    });
    it("normalizes through desc selectors", function () {
        expect(slx(".x.a.a .x.b.b").toString()).toBe(".a.x .b.x");
    });
    it("normalizes through next selectors", function () {
        expect(slx(".x.a.a + .x.b.b").toString()).toBe(".a.x+.b.x");
    });
    it("normalizes through succ selectors", function () {
        expect(slx(".x.a.a ~ .x.b.b").toString()).toBe(".a.x~.b.x");
    });
    it("normalizes through multiple child selectors", function () {
        expect(slx(".x.a.a > .x.b.b > .x.c.c").toString()).toBe(".a.x>.b.x>.c.x");
    });
    it("normalizes through multiple combinators", function () {
        expect(slx(".x.a.a .x.b.b > .x.c.c ~ .x.d.d + .x.e.e").toString()).toBe(".a.x .b.x>.c.x~.d.x+.e.x");
    });

});
