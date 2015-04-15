define(['Core', 'Core/RouteManager', 'BackBone'], function (Core, Router, BackBone) {
    'use strict';
    var testController = {value: ''},
        applicationConfig = {
            appPath: 'specs/tb/apps',
            active: 'test',
            route: '',
            applications: {
                test: {
                    label: 'Test application',
                    config: {}
                }
            }
        };
    Core.ApplicationManager.on('appIsReady', function (application) {
        if ('test' === application.getName()) {
            Core.ControllerManager.loadController('test', 'TestController').done(function (controller) {
                testController = controller;
            });
        }
    });
    Core.ApplicationManager.init(applicationConfig);

    describe('RouteManager spec', function () {
        it('Adding Test application into ApplicationManager', function (done) {
            expect(true).toBe(true);
            setTimeout(function () {
                done();
            }, 100);
        });
        it('Call initRouter will start BackBone history component with config', function () {
            Router.initRouter();
            expect(BackBone.history.options).toEqual({
                root: '/'
            });
            BackBone.history.stop();
            Router.initRouter({
                silent: true
            });
            expect(BackBone.history.options).toEqual({
                root: '/',
                silent: true
            });
        });
        it('Register route without giving route config will throw an exception', function () {
            try {
                Router.registerRoute('app', {});
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual('Error n 500 RouteManagerException: A routes key must be provided');
            }
        });
        it('Register route with a non-object route config will throw an exception', function () {
            try {
                Router.registerRoute('app', {
                    routes: ''
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual('Error n 500 RouteManagerException: Routes must be an object');
            }
        });
        it('Register route which is not an object will throw an exception', function () {
            try {
                Router.registerRoute('app', {
                    routes: {
                        'test': '/test'
                    }
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual('Error n 500 RouteManagerException: test route infos must be an object');
            }
        });
        it('Register route which has no `url` property will throw an exception', function () {
            try {
                Router.registerRoute('app', {
                    routes: {
                        'test': {}
                    }
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual('Error n 500 RouteManagerException: test route infos must have `url` property');
            }
        });
        it('Register route which has no action `property` will throw an exception', function () {
            try {
                Router.registerRoute('app', {
                    routes: {
                        'test': {
                            url: '/test'
                        }
                    }
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual('Error n 500 RouteManagerException: test route infos must have `action` property');
            }
        });
        xit('Navigate to TestController::fooAction by path', function (done) {
            Router.navigateByPath('/test/foo');
            setTimeout(function () {
                expect(testController.value).toEqual('foo');
                done();
            }, 100);
        });
        xit('Register route with prefix and navigate to it by path', function (done) {
            Router.registerRoute('test', {
                prefix: 'testApp',
                routes: {
                    'bar': {
                        url: '/test/bar',
                        action: 'TestController:bar'
                    },
                    'foo': {
                        url: 'test/foo',
                        action: 'TestController:foo'
                    }
                }
            });
            Router.navigateByPath('testApp/test/bar');
            setTimeout(function () {
                expect(testController.value).toEqual('bar');
                done();
            }, 100);
        });
        xit('Navigate to TestController::fooAction() with right route name', function (done) {
            Router.navigateByName('test:bar');
            setTimeout(function () {
                expect(testController.value).toEqual('bar');
                done();
            }, 100);
        });
        it('Navigate to TestController::fooAction() with unknown route name will throw an exception', function (done) {
            setTimeout(function () {
                try {
                    Router.navigateByName('test:foobar');
                    expect(true).toEqual(false);
                } catch (e) {
                    expect(e).toEqual('Error n 500 RouteManagerException: buildLink routeInfos can\'t be found');
                }
                done();
            }, 100);
        });
    }); // end of call describe() function
});
