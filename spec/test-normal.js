var slx = require('../index');

describe("normalization", function () {
    it("eliminates duplicate .class selectors", function () {
        expect(slx(".a.a").normal().toString())
            .toBe(".a");
    });
    it("cancels .class and :not(.class) selectors", function () {
        expect(slx(".a:not(.a)").normal().toString())
            .toBe(":not(*)");
    });
    it("sorts .class selectors by name", function () {
        expect(slx(".b.a").normal().toString())
            .toBe(".a.b");
    });
    it("sorts :not(.class) selectors by name", function () {
        expect(slx(".b:not(.a)").normal().toString())
            .toBe(":not(.a).b");
    });
    it("puts ids before classes", function () {
        expect(slx(".a#b").normal().toString())
            .toBe("#b.a");
    });

    it("normalizes through child selectors", function () {
        expect(slx(".x.a.a > .x.b.b").normal().toString())
            .toBe(".a.x>.b.x");
    });
    it("normalizes through desc selectors", function () {
        expect(slx(".x.a.a .x.b.b").normal().toString())
            .toBe(".a.x .b.x");
    });
    it("normalizes through next selectors", function () {
        expect(slx(".x.a.a + .x.b.b").normal().toString())
            .toBe(".a.x+.b.x");
    });
    it("normalizes through succ selectors", function () {
        expect(slx(".x.a.a ~ .x.b.b").normal().toString())
            .toBe(".a.x~.b.x");
    });
    it("normalizes through multiple child selectors", function () {
        expect(slx(".x.a.a > .x.b.b > .x.c.c").normal().toString())
            .toBe(".a.x>.b.x>.c.x");
    });
    it("normalizes through multiple combinators", function () {
        expect(slx(".x.a.a .x.b.b > .x.c.c ~ .x.d.d + .x.e.e").normal().toString())
            .toBe(".a.x .b.x>.c.x~.d.x+.e.x");
    });

});
