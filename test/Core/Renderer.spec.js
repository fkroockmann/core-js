define(['Core/Renderer', 'nunjucks', 'es5-shim/es5-shim'], function (Renderer, nunjucks) {
    'use strict';

    describe("Renderer test suite", function () {
        it("Should render simple strings", function () {
            expect(Renderer.render('Hello world')).toEqual('Hello world');
        });

        it("Should render string with variables", function () {
            expect(Renderer.render('Hello {{ world }}', {'world': 'world'})).toEqual('Hello world');
        });

        it("Should ignore undefined variables on render()", function () {
            expect(Renderer.render('Hello {{ not_defined_var }}', {})).toEqual('Hello ');
        });

        it("Should return nunjucks instance when getEngine() is called", function () {
            expect(Renderer.getEngine() === nunjucks).toBe(true);
        });
    });
});