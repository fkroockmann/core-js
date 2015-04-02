define(['require', 'Core', 'Core/ApplicationContainer'], function (require) {
    'use strict';

    var api = require('Core'),
        apps = require('Core/ApplicationContainer'),

        /**
         * Basic controller for the specs
         * @type {Object}
         */
        controller = {
            config: {
                imports: []
            },

            appName: 'SpecApp',

            testAction: function (test) {
                if (test === true) {
                    throw 'Test is working';
                }
                return 'It expected';
            },

            initialize: function () {
                return true;
            }
        },

        errorMessage = function (code, message) {
            return 'Error n ' + code + ' ControllerManagerException: ' + message;
        };

    describe('Controller manager spec', function () {

        it('Test throw errors', function () {
            try {
                api.ControllerManager.registerController('SpecCtrl', {});
                expect(false).toBe(true);
            } catch (e) {
                expect(e).toBe(errorMessage(15004, 'Controller name do not respect {name}Controller style declaration'));
            }
            try {
                api.ControllerManager.registerController('SpecCtrlController', {});
                expect(false).toBe(true);
            } catch (e) {
                expect(e).toBe(errorMessage(15003, 'Controller should be attached to an App'));
            }
            try {
                api.ControllerManager.getAppControllers('SpecCtrl');
                expect(false).toBe(true);
            } catch (e) {
                expect(e).toBe(errorMessage(15006, 'Controller Not Found'));
            }
            try {
                api.ControllerManager.loadController('', '');
            } catch (e) {
                expect(e).toBe(errorMessage(15004, 'Controller name do not respect {name}Controller style declaration'));
            }
            try {
                api.ControllerManager.loadController(null, {});
            } catch (e) {
                expect(e).toBe(errorMessage(15004, 'Controller name do not respect {name}Controller style declaration'));
            }
            try {
                api.ControllerManager.loadController(null, 'suspiciousController');
            } catch (e) {
                expect(e).toBe(errorMessage(15005, 'appName have to be defined as String'));
            }
        });

        it('Controller contructor generation', function () {
            var SpecCtrlClass, SpecCtrl;
            try {
                apps.getInstance().register({
                    name: 'SpecApp',
                    instance: {}
                });
                api.ControllerManager.registerController('SpecController', controller);
            } catch (e) {
                expect(e).toBe(false);
            }
            expect(controller.initialize).toBe(undefined);
            try {
                SpecCtrlClass = api.ControllerManager.getAppControllers('SpecApp').SpecController;
                SpecCtrl = new SpecCtrlClass({});
            } catch (e) {
                expect(e).toBe(false);
            }
            expect(SpecCtrl.getName()).toBe('SpecController');
        });
        it('Test controller action invoke', function () {
            var SpecCtrlClass, SpecCtrl;
            try {
                SpecCtrlClass = api.ControllerManager.getAllControllers().SpecApp.SpecController;
                SpecCtrl = new SpecCtrlClass({});
            } catch (e) {
                expect(e).toBe(false);
            }
            try {
                SpecCtrl.invoke('notExistant', {});
            } catch (e) {
                expect(e).toBe(errorMessage(15001, 'notExistantAction' + ' Action Doesnt Exists in ' + 'SpecController' + ' Controller'));
            }
            try {
                SpecCtrl.invoke('test', [true]);
            } catch (e) {
                expect(e).toBe(errorMessage(15002, 'Error while executing [' + 'testAction' + '] in ' + 'SpecController' + ' controller with message: ' + 'Test is working'));
            }
        });
        xit('Test multi controller instance', function () {
            var SpecCtrl;
            try {
                SpecCtrl = api.ControllerManager.getAllControllers().SpecApp.SpecCtrlController;
                // SpecCtrl = new SpecCtrlClass({});
            } catch (e) {
                expect(e).toBe(false);
            }
            spyOn(SpecCtrl, 'onDisabled');

            api.ControllerManager.registerController('SpecCtrl2', {
                config: {
                    imports: []
                },
                appName: 'SpecApp'
            });
            api.ControllerManager.loadController('SpecApp', 'SpecCtrl2Controler');
            expect(controller.onDisabled).toHaveBeenCalled();
        });
    });
});