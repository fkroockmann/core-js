define(['Core/ApplicationContainer'], function (AppContainer) {
    'use strict';
    describe("ApplicationContainer test", function () {

        it("Should be empty", function () {
            var appCtn = AppContainer.getInstance();
            expect(appCtn.container.length).toEqual(0);
        });
        it('Should thow an code 60000 exception', function () {
            var appCtn = AppContainer.getInstance(),
                hasException = false;
            try {
                appCtn.register();
            } catch (e) {
                hasException = true;
            } finally {
                expect(hasException).toBe(true);
            }
        });
        it('Should thow an code 60001 exception', function () {
            var appCtn = AppContainer.getInstance(),
                hasException = false;
            try {
                appCtn.register({});
            } catch (e) {
                hasException = true;
            } finally {
                expect(hasException).toBe(true);
            }
        });
        it('Should content 1 element', function () {
            var appCtn = AppContainer.getInstance();
            try {
                appCtn.register({
                    name: "radical",
                    instance: {}
                });
                expect(appCtn.container.length).toEqual(1);
            } catch (e) {
                expect(true).toBe(false);
            }
        });
        it('Should content 2 elements', function () {
            var appCtn = AppContainer.getInstance();
            appCtn.reset();
            try {
                appCtn.register({
                    name: "radical",
                    instance: {}
                });
                appCtn.register({
                    name: "rstrn",
                    instance: {}
                });
                expect(appCtn.container.length).toEqual(2);
                appCtn.reset();
                expect(appCtn.container.length).toEqual(0);
            } catch (e) {
                expect(true).toBe(false);
            }
        });
    });
});