/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of BackBee.
 *
 * BackBee is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BackBee is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BackBee. If not, see <http://www.gnu.org/licenses/>.
 */
define('Core/ControllerManager', ['require', 'Core/Api', 'Core/ApplicationContainer', 'jquery', 'jsclass', 'Core/Utils'], function (require) {
    'use strict';
    var Api = require('Core/Api'),
        jQuery = require('jquery'),
        utils = require('Core/Utils'),
        appContainer = require('Core/ApplicationContainer'),
        controllerContainer = {},
        shortNameMap = {},
        controllerInstance = {},
        enabledController = null,
        exception = function (code, message) {
            Api.exception('ControllerManagerException', code, message);
        },
        /**
         *  Controller abstract class
         *  @type {Object}
         */
        AbstractController = new JS.Class({
            /**
             * Controller contructor
             * @return {AbstractController} [description]
             */
            initialize: function () {
                this.state = 0;
                this.enabled = false;
                var appInfos = appContainer.getInstance().getByAppInfosName(this.appName);
                this.mainApp = appInfos.instance;
            },
            /**
             * Depencies loader
             * @return {promise}
             */
            handleImport: function () {
                var def = new jQuery.Deferred();
                if (jQuery.isArray(this.config.imports) && this.config.imports.length) {
                    utils.requireWithPromise(this.config.imports).done(def.resolve).fail(function (reason) {
                        var error = {
                            method: 'ControllerManager:handleImport',
                            message: reason
                        };
                        def.reject(error);
                    });
                } else {
                    def.resolve();
                }
                return def.promise();
            },

            beforeCall: function (callName) {
                var dfd = new jQuery.Deferred(),
                    self = this;

                if (this.config.define !== undefined &&  this.config.define[callName] !== undefined) {
                    utils.requireWithPromise(this.config.define[callName]).then(
                        function () {
                            dfd.resolve.call(self, require);
                        },
                        function (reason) {
                            Api.exception.silent('ControllerManagerException', 15007, 'Something goes worng during the depencies loading of ' + callName, {service: callName, reason: reason, depencies: self.config.define[callName]});
                            dfd.reject.call(self);
                        }
                    );
                } else {
                    dfd.resolve.call(self, false);
                }

                return dfd.promise();
            },

            /**
             * Action automaticly call when the Controller is Enabled
             * @return {false}
             */
            onEnabled: function () {
                this.enabled = true;
            },
            /**
             * Action automaticly call when the Controller is Disabled
             * @return {false}
             */
            onDisabled: function () {
                this.enabled = false;
            },
            /**
             * Function used to call controller action
             * @param  {String} action
             * @param  {Mixed} params
             * @return {false}
             */
            invoke: function (action, params) {
                var actionName = action + 'Action';
                if (typeof this[actionName] !== 'function') {
                    exception(15001, actionName + ' Action Doesnt Exists in ' + this.getName() + ' Controller');
                }
                if (typeof this[actionName] !== 'function') {
                    exception(15001, actionName + ' Action Doesnt Exists in ' + this.getName() + ' Cotroller');
                }
                try {
                    this[actionName].apply(this, params);
                } catch (e) {
                    exception(15002, 'Error while executing [' + actionName + '] in ' + this.getName() + ' controller with message: ' + e);
                }
            }
        }),
        /**
         * Change the current controller
         * @param  {AbstractController} currentController
         * @return {false}
         */
        updateEnabledController = function (currentController) {
            if (currentController === enabledController) {
                return;
            }
            if (enabledController) {
                enabledController.onDisabled();
            }
            enabledController = currentController;
            enabledController.onEnabled();
        },
        /**
         * Compute the controller name used into ControllerContainer
         * @param  {String} controllerName
         * @return {String}
         */
        computeControllerName = function (controllerName) {
            var ctlName = '',
                controllerPos = -1;
            if ('string' === typeof controllerName) {
                controllerPos = controllerName.indexOf('Controller');
            }
            if (controllerPos !== -1) {
                controllerName = controllerName.substring(0, controllerPos);
                ctlName = controllerName.toLowerCase() + '.controller';
            }
            if (ctlName.length === 0) {
                exception(15004, 'Controller name do not respect {name}Controller style declaration');
            }
            return ctlName;
        },
        /**
         * Automatique controller initialiser before action call execution
         * @param  {String} appName
         * @param  {String} controllerName
         * @param  {jQuery.Deferred} def
         * @return {False}
         */
        initController = function (appName, controllerName, def) {
            var currentController, fullControllerName = appName + '.' + computeControllerName(controllerName);
            currentController = new controllerContainer[appName][controllerName]();
            controllerInstance[fullControllerName] = currentController;
            currentController.handleImport().then(function () {
                currentController.onInit(require);
                updateEnabledController(currentController);
                def.resolve(currentController);
            });
        },
        /**
         * Return a short name for the controller. IE MainController will
         * @param {string} controllerFullName
         */
        getControllerShortName = function (controllerFullName) {
            var controllerName, controllerNameInfos = computeControllerName(controllerFullName);
            controllerNameInfos = controllerNameInfos.split(".");
            controllerName = controllerNameInfos[0];
            return controllerName;
        },
        /**
         * Register a new controller
         * @param  {String} controllerName
         * @param  {Object} ControllerDef
         * @return {False}
         */
        registerController = function (controllerName, ControllerDef) {
            var appName = ControllerDef.appName,
                controllerShortName = getControllerShortName(controllerName),
                Constructor = {};
            if (false === ControllerDef.hasOwnProperty('appName')) {
                exception(15003, 'Controller should be attached to an App');
            }
            if (ControllerDef.hasOwnProperty('initialize')) {
                delete ControllerDef.initialize;
            }
            Constructor = new JS.Class(AbstractController, ControllerDef);
            Constructor.define('initialize', (function (config) {
                return function () {
                    this.callSuper(config);
                };
            }(ControllerDef.config)));
            Constructor.define('getName', (function (name) {
                return function () {
                    return name;
                };
            }(controllerName)));
            if (!controllerContainer[appName]) {
                controllerContainer[appName] = {};
            }
            controllerContainer[appName][controllerName] = Constructor;
            /*Save controller shortname so that it can be used to load services*/
            controllerShortName = controllerShortName.toLowerCase();
            shortNameMap[appName + ':' + controllerShortName] = {
                constructor: Constructor,
                originalName: controllerName
            };
        },
        /**
         * Load controller and retrieve it if its already been loaded
         * @param  {String} appName
         * @param  {String} controllerName
         * @return {Object}
         */
        loadController = function (appName, controllerName) {
            var fullControllerName = appName + '.' + computeControllerName(controllerName),
                def = jQuery.Deferred(),
                cInstance = '';
            if (!appName || typeof appName !== 'string') {
                exception(15005, 'appName have to be defined as String');
            }
            cInstance = controllerInstance[fullControllerName];
            if (cInstance) {
                updateEnabledController(cInstance);
                def.resolve(cInstance);
            } else {
                if (controllerContainer.hasOwnProperty(appName) && typeof controllerContainer[appName][controllerName] === 'function') {
                    initController(appName, controllerName, def);
                } else {
                    utils.requireWithPromise([fullControllerName]).done(function () {
                        initController(appName, controllerName, def);
                    }).fail(def.reject);
                }
            }
            return def.promise();
        },
        /*
         * For every controller a short name is registered that is
         * loadControllerByShortName allows us to find the controller by using this
         **/
        loadControllerByShortName = function (appName, shortControllerName) {
            var dfd = new jQuery.Deferred(),
                completeControllerName,
                controllerInfos,
                ctlFileName = appName + '.' + shortControllerName + '.controller';

            if (!appName || typeof appName !== 'string') {
                exception(15005, 'appName have to be defined as String');
            }

            if (!appName || typeof appName !== 'string') {
                exception(15006, 'shortControllerName have to be defined as String');
            }

            controllerInfos = shortNameMap[appName + ':' + shortControllerName];

            if (controllerInfos) {
                return loadController(appName, controllerInfos.originalName);
            }

            /*first, because of the use shortName, we need load the controller*/
            utils.requireWithPromise([ctlFileName]).done(function () {
                completeControllerName = shortNameMap[appName + ':' + shortControllerName].originalName;
                return loadController(appName, completeControllerName).done(dfd.resolve).fail(dfd.reject);
            }).fail(dfd.reject);

            return dfd.promise();
        },
        /**
         * Return the controler corresponding at the current application actualy launched
         * @param  {String} appName
         * @return {False}
         */
        getAppControllers = function (appName) {
            if (controllerContainer.hasOwnProperty(appName)) {
                return controllerContainer[appName];
            }
            exception(15006, 'Controller Not Found');
        },
        /**
         * Controller manager api exposition
         * @type {Object}
         */
        ControllerManager = {
            registerController: registerController,
            loadController: loadController,
            loadControllerByShortName: loadControllerByShortName,
            getAppControllers: getAppControllers,
            getAllControllers: function () {
                return controllerContainer;
            }
        };
    Api.register('ControllerManager', ControllerManager);
    return ControllerManager;
});