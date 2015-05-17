var slx = require('../index');

describe("parsing and formatting", function () {
    it("accepts * selector", function () {
        expect(slx("*").toString()).toBe("*");
    });
    it("accepts .class selectors", function () {
        expect(slx(".a").toString()).toBe(".a");
    });
    it("accepts #id selectors", function () {
        expect(slx("#a").toString()).toBe("#a");
    });
    it("accepts tag selectors", function () {
        expect(slx("a").toString()).toBe("a");
    });
    it("accepts basic [attribute] selectors", function () {
        expect(slx("[href]").toString()).toBe("[href]");
    });
    it("accepts [attribute=foo] selector", function () {
        expect(slx('[href="#"]').toString()).toBe('[href="#"]');
    });
    it("accepts [attribute~=foo] selector", function () {
        expect(slx('[href~="#"]').toString()).toBe('[href~="#"]');
    });
    it("accepts [attribute|=foo] selector", function () {
        expect(slx('[href|="#"]').toString()).toBe('[href|="#"]');
    });
    it("accepts [attribute^=foo] selector", function () {
        expect(slx('[href^="#"]').toString()).toBe('[href^="#"]');
    });
    it("accepts [attribute$=foo] selector", function () {
        expect(slx('[href$="#"]').toString()).toBe('[href$="#"]');
    });
    it("accepts [attribute*=foo] selector", function () {
        expect(slx('[href*="#"]').toString()).toBe('[href*="#"]');
    });

    it("accepts :pseudo selectors", function () {
        expect(slx(":hover").toString()).toBe(":hover");
    });
    it("accepts tag .class and :pseudo selectors", function () {
        expect(slx("a.b:hover").toString()).toBe("a.b:hover");
    });

    it("accepts ::pseudo-element selector", function () {
        expect(slx("::before").toString()).toBe("*::before");
    });
    it("accepts .class::pseudo-element selector", function () {
        expect(slx(".a::before").toString()).toBe(".a::before");
    });


    it("accepts tag.class selectors", function () {
        expect(slx("a.b").toString()).toBe("a.b");
    });
    it("accepts tag#id selectors", function () {
        expect(slx("a#b").toString()).toBe("a#b");
    });
    it("accepts tag[attribute] selectors", function () {
        expect(slx("a[href]").toString()).toBe("a[href]");
    });
    it("accepts .class.class selectors", function () {
        expect(slx(".a.b").toString()).toBe(".a.b");
    });

    it("accepts :pseudo selectors", function () {
        expect(slx(":hover").toString()).toBe(":hover");
    });

    it("accepts child * selectors", function () {
        expect(slx(".a>*").toString()).toBe(".a>*");
    });
    it("accepts child .class selectors", function () {
        expect(slx(".b>.a").toString()).toBe(".b>.a");
    });
    it("accepts child tag selectors", function () {
        expect(slx("ul.b>li").toString()).toBe("ul.b>li");
    });

    it("accepts descendant .class selectors", function () {
        expect(slx(".b .a").toString()).toBe(".b .a");
    });
    it("accepts descendant .class.class selectors", function () {
        expect(slx(".b .a.c").toString()).toBe(".b .a.c");
    });
    it("accepts descendant tag.class selectors", function () {
        expect(slx(".b a.c").toString()).toBe(".b a.c");
    });
    it("accepts descendant tag#id selectors", function () {
        expect(slx(".b a#c").toString()).toBe(".b a#c");
    });

    it("accepts next * selectors", function () {
        expect(slx(".b+*").toString()).toBe(".b+*");
    });
    it("accepts next .class selectors", function () {
        expect(slx(".b+.a").toString()).toBe(".b+.a");
    });

    it("accepts successor * selectors", function () {
        expect(slx(".b+*").toString()).toBe(".b+*");
    });
    it("accepts successor .class selectors", function () {
        expect(slx(".b+.a").toString()).toBe(".b+.a");
    });
    it("accepts selector, selector", function () {
        expect(slx(".b,.a").toString()).toBe(".b,.a");
    });

    it("accepts :not * selector", function () {
        expect(slx(":not(*)").toString()).toBe(":not(*)");
    });
    it("accepts :not .class selector", function () {
        expect(slx(":not(.a)").toString()).toBe(":not(.a)");
    });
    it("accepts :not #id selector", function () {
        expect(slx(":not(#a)").toString()).toBe(":not(#a)");
    });
    it("accepts :not tag selector", function () {
        expect(slx(":not(a)").toString()).toBe(":not(a)");
    });
    it("accepts :not [attribute] selector", function () {
        expect(slx(":not([href])").toString()).toBe(":not([href])");
    });
    it("accepts :not [attribute=foo] selector", function () {
        expect(slx(':not([href="#"])').toString()).toBe(':not([href="#"])');
    });
    it("accepts :not :pseudo selector", function () {
        expect(slx(':not(:hover)').toString()).toBe(':not(:hover)');
    });

});
