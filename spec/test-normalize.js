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

});
