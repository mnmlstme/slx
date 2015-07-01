var slx = require('../index');

describe("conjunction of selectors (logical AND, CSS juxtaposition)", function () {
    it("accepts .class selectors", function () {
        expect(slx(".a").and(slx(".b")).toString()).toBe(".a.b");
    });
    it("combines .class and #id selectors", function () {
        expect(slx(".a").and(slx("#b")).toString()).toBe("#b.a");
    });
    it("combines .class and :pseudo selectors", function () {
        expect(slx(".a").and(slx(":hover")).toString()).toBe(".a:hover");
    });

    it("combines child and .class selectors", function () {
        expect(slx(".a>*").and(slx(".b")).toString()).toBe(".a>.b");
    });
    it("combines child tag and .class selectors", function () {
        expect(slx("ul.a>li").and(slx(".b")).toString()).toBe("ul.a>li.b");
    });
    it("combines child tag and :pseudo selectors", function () {
        expect(slx("ul.a>li").and(slx(":hover")).toString()).toBe("ul.a>li:hover");
    });

    it("combines descendant and .class selectors", function () {
        expect(slx(".a *").and(slx(".b")).toString()).toBe(".a .b");
    });
    it("combines descendant .class and .class selectors", function () {
        expect(slx(".a .b").and(slx(".c")).toString()).toBe(".a .b.c");
    });
    it("combines next and .class selectors", function () {
        expect(slx(".a+*").and(slx(".b")).toString()).toBe(".a+.b");
    });
    it("combines next .class and .class selectors", function () {
        expect(slx(".a+.b").and(slx(".c")).toString()).toBe(".a+.b.c");
    });
    it("combines sibling and .class selectors", function () {
        expect(slx(".a~*").and(slx(".b")).toString()).toBe(".a~.b");
    });
    it("combines sibling .class and .class selectors", function () {
        expect(slx(".a~.b").and(slx(".c")).toString()).toBe(".a~.b.c");
    });
    it("combines identical .class selectors", function () {
        expect(slx(".a").and(slx(".a")).toString()).toBe(".a");
    });
    it("combines identical #id selectors", function () {
        expect(slx("#a").and(slx("#a")).toString()).toBe("#a");
    });
    it("combines identical tag selectors", function () {
        expect(slx("a").and(slx("a")).toString()).toBe("a");
    });
    it("combines identical [attribute] selectors", function () {
        expect(slx("[href]").and(slx("[href]")).toString()).toBe("[href]");
    });
    it("combines identical :pseudo selectors", function () {
        expect(slx(":hover").and(slx(":hover")).toString()).toBe(":hover");
    });
    it("combines identical literals", function () {
        expect(slx("a#b.c.d[e][f]:first-child:hover").and(slx("a#b.c[e]:hover")).toString())
            .toBe("a#b.c.d[e][f]:first-child:hover");
    });

    it("cancels :not .class and .class selectors", function () {
        expect(slx(":not(.a)").and(slx(".a")).toString())
            .toBe(":not(*)");
    });
    it("cancels multiple tag selectors", function () {
        expect(slx("a.b").and(slx("span")).toString())
            .toBe(":not(*)");
    });
    it("cancels multiple #id selectors", function () {
        expect(slx("#a").and(slx("#b")).toString())
            .toBe(":not(*)");
    });

    it("combines two child selectors", function () {
        expect(slx(".a>*").and(slx(".b>*")).toString())
            .toBe(".a.b>*");
    });
    it("combines two next selectors", function () {
        expect(slx(".a+*").and(slx(".b+*")).toString())
            .toBe(".a.b+*");
    });

    it("combines child and descendent selectors", function () {
        expect(slx(".a>*").and(slx(".a *")).toString())
            .toBe(".a>*");
        expect(slx(".a>.b").and(slx(".a .b")).toString())
            .toBe(".a>.b");
    });

    it("combines next and successor selectors", function () {
        expect(slx(".a+*").and(slx(".a~*")).toString())
            .toBe(".a+*");
        expect(slx(".a+.b").and(slx(".a~.b")).toString())
            .toBe(".a+.b");
    });

});
