var slx = require('../index');

var DEFER = true; // skip deferred tests

describe("disjunction of selectors (logical OR, CSS comma)", function () {
    it("accepts .class selectors", function () {
        expect(slx(".a").or(slx(".b")).toString()).toBe(".a,.b");
    });
    it("accepts .class and #id selectors", function () {
        expect(slx(".a").or(slx("#b")).toString()).toBe(".a,#b");
    });
    it("accepts child and descendant selectors", function () {
        expect(slx("ul.a>li").or(slx("#b .b")).toString()).toBe("ul.a>li,#b .b");
    });

    DEFER || it("does not repeat simple .class selectors", function () {
        expect(slx(".a").or(slx(".a")).toString()).toBe(".a");
    });
    DEFER || it("does not repeat simple #id selectors", function () {
        expect(slx("#a").or(slx("#a")).toString()).toBe("#a");
    });
    DEFER || it("does not repeat identical product terms of .class selectors", function () {
        expect(slx(".a.b").or(slx(".a.b")).toString()).toBe(".a.b");
    });
    DEFER || it("combines :not .class and .class", function () {
        expect(slx(":not(.a)").or(slx(".a")).toString()).toBe("*");
    });

});
