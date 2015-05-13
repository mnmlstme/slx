"use strict";

var slx = require('../src/slx');

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

});

describe("logical OR operator", function () {
    it("accepts two selectors", function () {
        expect(slx(".a").or(slx(".b")).toString()).toBe(".a,.b");
    });
});
