var slx = require('../index');

describe("disjunction of selectors (logical OR, CSS comma)", function () {
    it("accepts .class selectors", function () {
        expect(slx(".a").or(slx(".b")).toString()).toBe(".a,.b");
    });
    it("accepts .class and #id selectors", function () {
        expect(slx(".a").or(slx("#b")).toString()).toBe("#b,.a");
    });
    it("accepts child and descendant selectors", function () {
        expect(slx("ul.a>li").or(slx("#b .b")).toString()).toBe("ul.a>li,#b .b");
    });

    it("eliminates repeated .class selectors", function () {
        expect(slx(".a").or(slx(".a")).toString()).toBe(".a");
    });
    it("eliminates repeated #id selectors", function () {
        expect(slx("#a").or(slx("#a")).toString()).toBe("#a");
    });
    it("eliminates repeated product terms", function () {
        expect(slx(".a.b").or(slx(".a.b")).toString()).toBe(".a.b");
    });

    it("combines :not .class and .class", function () {
        expect(slx(":not(.a)").or(slx(".a")).toString()).toBe("*");
    });
    it("combines products containing :not .class and .class", function () {
        expect(slx(":not(.a).b").or(slx(".a.b")).toString()).toBe(".b");
    });

});
