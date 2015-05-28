var slx = require('../index');

describe("complement of selector", function () {
    it("inverts * selector", function () {
        expect(slx("*").not().toString()).toBe(":not(*)");
    });
    it("inverts :not(*) selector", function () {
        expect(slx(":not(*)").not().toString()).toBe("*");
    });
    it("inverts .class selector", function () {
        expect(slx(".a").not().toString()).toBe(":not(.a)");
    });
    it("inverts :not(.class) selector", function () {
        expect(slx(":not(.a)").not().toString()).toBe(".a");
    });
    it("inverts #id selector", function () {
        expect(slx("#a").not().toString()).toBe(":not(#a)");
    });
    it("inverts :not(#id) selector", function () {
        expect(slx(":not(#a)").not().toString()).toBe("#a");
    });
    it("inverts tag selector", function () {
        expect(slx("a").not().toString()).toBe(":not(a)");
    });
    it("inverts :not(tag) selector", function () {
        expect(slx(":not(a)").not().toString()).toBe("a");
    });
    it("inverts [attr] selector", function () {
        expect(slx("[href]").not().toString()).toBe(":not([href])");
    });
    it("inverts :not([attr]) selector", function () {
        expect(slx(":not([href])").not().toString()).toBe("[href]");
    });
    it("inverts :pseudo selector", function () {
        expect(slx(":hover").not().toString()).toBe(":not(:hover)");
    });
    it("inverts :not(:pseudo) selector", function () {
        expect(slx(":not(:hover)").not().toString()).toBe(":hover");
    });

    it("inverts a conjunction of .class selectors", function () {
        expect(slx(".a.b").not().toString()).toBe(":not(.a),:not(.b)");
    });
    it("inverts a conjunction of tag and .class selectors", function () {
        expect(slx("a.b").not().toString()).toBe(":not(a),:not(.b)");
    });
    it("inverts a conjunction of tag and [attr] selectors", function () {
        expect(slx("a[href]").not().toString()).toBe(":not(a),:not([href])");
    });

    it("inverts a disjunction of .class selectors", function () {
        expect(slx(".a,.b").not().toString()).toBe(":not(.a):not(.b)");
    });

    it("inverts the child selector", function () {
        expect(slx(".a > *").not().toString()).toBe(":not(.a)>*");
    });
    it("inverts a child class selector", function () {
        expect(slx(".a > .b").not().toString()).toBe(":not(.b),:not(.a)>*");
    });
    it("inverts a chain of child class selectors", function () {
        expect(slx(".a > .b > .c").not().toString()).toBe(":not(.c),:not(.b)>*,:not(.a)>*>*");
    });

    it("inverts the next selector", function () {
        expect(slx(".a + *").not().toString()).toBe(":not(.a)+*");
    });
    it("inverts a next class selector", function () {
        expect(slx(".a + .b").not().toString()).toBe(":not(.b),:not(.a)+*");
    });

    // The following are not valid CSS3, but they will be CSS4
    it("inverts the desc selector", function () {
        expect(slx(".a .b").not().toString()).toBe(":not(.b),:not(.a *)");
    });
    it("inverts the succ selector", function () {
        expect(slx(".a ~ .b").not().toString()).toBe(":not(.b),:not(.a~*)");
    });

});
