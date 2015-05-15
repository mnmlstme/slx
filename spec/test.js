"use strict";

var slx = require('../src/slx');

var DEFER = true; // skip deferred tests

describe("work in progress", function () {
});

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
    it("accepts tag.class selectors", function () {
        expect(slx("a.b").toString()).toBe("a.b");
    });
    it("accepts tag#id selectors", function () {
        expect(slx("a#b").toString()).toBe("a#b");
    });
    it("accepts .class.class selectors", function () {
        expect(slx(".a.b").toString()).toBe(".a.b");
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

});

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

describe("conjunction of selectors (logical AND, CSS juxtaposition)", function () {
    it("accepts .class selectors", function () {
        expect(slx(".a").and(slx(".b")).toString()).toBe(".a.b");
    });
    it("accepts .class and #id selectors", function () {
        expect(slx(".a").and(slx("#b")).toString()).toBe("#b.a");
    });
    it("accepts child and .class selectors", function () {
        expect(slx(".a>*").and(slx(".b")).toString()).toBe(".a>.b");
    });
    it("accepts child tag  and .class selectors", function () {
        expect(slx("ul.a>li").and(slx(".b")).toString()).toBe("ul.a>li.b");
    });
    it("accepts descendant and .class selectors", function () {
        expect(slx(".a *").and(slx(".b")).toString()).toBe(".a .b");
    });
    it("accepts descendant .class and .class selectors", function () {
        expect(slx(".a .b").and(slx(".c")).toString()).toBe(".a .b.c");
    });
    it("accepts next and .class selectors", function () {
        expect(slx(".a+*").and(slx(".b")).toString()).toBe(".a+.b");
    });
    it("accepts next .class and .class selectors", function () {
        expect(slx(".a+.b").and(slx(".c")).toString()).toBe(".a+.b.c");
    });
    it("accepts sibling and .class selectors", function () {
        expect(slx(".a~*").and(slx(".b")).toString()).toBe(".a~.b");
    });
    it("accepts sibling .class and .class selectors", function () {
        expect(slx(".a~.b").and(slx(".c")).toString()).toBe(".a~.b.c");
    });
    it("combines identical .class selectors", function () {
        expect(slx(".a").and(slx(".a")).toString()).toBe(".a");
    });
    DEFER || it("invalidates :not .class and .class selectors", function () {
        expect(slx(":not(.a)").and(slx(".a")).toString()).toBe(":not(*)");
    });
    DEFER || it("invalidates multiple tag selectors", function () {
        expect(slx("a.b").and(slx("span")).toString()).toBe(":not(*)");
    });
    DEFER || it("invalidates multiple #id selectors", function () {
        expect(slx("#a").and(slx("#b")).toString()).toBe(":not(*)");
    });
});
