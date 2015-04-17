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
/**
 * bb.ApplicationManager
 * Responsability
 *  - provide an application skeleton
 *  - What is an application
 *  Application handle views
 *  [-View 1]
 *  [-View 2]
 *  [-View 3]
 *  [-View 4]
 *  application recieves requests via route
 *
 *  /#layout/create ---> route is handled by Application Route
 *                      ---> Then controller is called
 *                          ---> Then the right method is invoked
 *                              --> The right template
 *
 *  Application can declare many controller BackBone Controllers
 *  Application Manager
 **/
define('Core/ApplicationManager', ['require', 'BackBone', 'jsclass', 'jquery', 'underscore', 'Core/Utils', 'Core/ApplicationContainer', 'Core/Api', 'Core/ControllerManager'], function (require) {
    'use strict';
    /* Abstract Application with Interface */
    /* dependence */
    var jQuery = require('jquery'),
        underscore = require('underscore'),
        Api = require('Core/Api'),
        Backbone = require('BackBone'),
        Utils = require('Core/Utils'),
        ControllerManager = require('Core/ControllerManager'),
        AppDefContainer = {},
        currentApplication = null,
        config = null,
        ApplicationManager = {},
        AppContainer = require('Core/ApplicationContainer').getInstance(),
        /**
         * AbstractApplication
         */
        AbstractApplication = new JS.Class({
            initialize: function (config) {
                this.config = {};
                this.state = 0;
                underscore.extend(this, Backbone.Events);
                this.config = jQuery.extend(true, this.config, config);
            },

            getMainRoute: function () {
                return this.config.mainRoute;
            },

            exposeMenu: function () {
                return;
            },

            dispatchToController: function (controller, action, params) {
                var def = new jQuery.Deferred();
                ControllerManager.loadController(this.getName(), controller).done(function (controller) {
                    try {
                        params = underscore.rest(params); //# cf http://underscorejs.org/#rest
                        controller.invoke(action, params);
                    } catch (reason) {
                        def.reject(reason);
                    }
                }).fail(function (reason) {
                    def.reject(reason.message);
                });
                return def.promise();
            },

            invokeControllerService: function (controller, service, params) {
                var dfd = new jQuery.Deferred(),
                    serviceName,
                    self = this;

                ControllerManager.loadControllerByShortName(this.getName(), controller).done(function (controller) {
                    try {
                        serviceName = service + "Service";
                        controller.beforeCall(serviceName).then(
                            function (req) {
                                if (req) {
                                    params.unshift(req);
                                }
                                try {
                                    dfd.resolve(controller[serviceName].apply(controller, params));
                                } catch (e) {
                                    Api.exception.silent('InvokeServiceException', 15008, 'Something goes worng during the service ' + serviceName + ' execution', {controller: self.getName(), service: serviceName, error: e});
                                }
                            },
                            function () {
                                dfd.resolve(controller[serviceName].apply(controller, params));
                            }
                        );
                    } catch (reason) {
                        dfd.reject(reason);
                    }
                }).fail(function (reason) {
                    dfd.reject(reason);
                });
                return dfd.promise();
            },
            /**
             * @TODO finalise setter
             *
             * [setControllerMng description]
             * @param {[type]} controllerMng [description]
             */
            setControllerMng: function (controllerMng) {
                return controllerMng;
            },

            onInit: function () {
                return;
            },

            onStart: function () {
                this.trigger(this.getName() + ':onStart');
            },

            onStop: function () {
                return;
            },

            onResume: function () {
                return;
            },

            onError: function (e) {
                Api.exception.silent('AbstractApplicationException', 1, 'error in[' + this.name + '] application', {error: e});
            }
        }),
        /*url --> router --> appManager --> controller --> action*/
        /**
         * var app = getAppByRoute(route)
         * app.invoke(controller:action)
         *  - controller.init execute ation
         *
         **/
        registerApplication = function (appname, AppDef) {
            if ('string' !== typeof appname) {
                throw "ApplicationManager :appname should be a string";
            }
            if ('object' !== typeof AppDef) {
                throw 'ApplicationManager : appDef Is undefined';
            }
            var ApplicationConstructor = new JS.Class(AbstractApplication, AppDef);
            /**
             *
             */
            ApplicationConstructor.define('getName', (function (name) {
                return function () {
                    this.name = name;
                    return name;
                };
            }(appname)));
            if (AppDefContainer.hasOwnProperty(appname)) {
                Api.exception('ApplicationManagerException', 50007, 'An application named [' + appname + '] already exists.');
            }
            AppDefContainer[appname] = ApplicationConstructor;
        },

        registerAppRoutes = function (routes) {
            var def = new jQuery.Deferred();
            return Utils.requireWithPromise(routes).done(function () {
                ApplicationManager.trigger('routesLoaded');
                def.resolve.apply(this, arguments);
            }).fail(function (reason) {
                def.reject(reason);
            });
        },

        launchApplication = function (appname, config) {
            var dfd = new jQuery.Deferred(),
                applicationInfos = AppContainer.getByAppInfosName(appname),
                Application = AppDefContainer[appname],
                instance;
            try {
                config = config || {};
                /* If the current application is called */
                if (currentApplication && (currentApplication.getName() === appname)) {
                    dfd.resolve(currentApplication);
                } else {
                    /** If app has not been loaded yet */
                    if (!applicationInfos) {
                        /** If app def can't be found */
                        if (!Application) {
                            return load(appname, config); //@TODO resolve 'load' was used before it was defined.
                        }
                        instance = new Application(config);
                        /** stop currentApplication */
                        applicationInfos = {
                            instance: instance,
                            name: appname
                        };
                        /** stop current application */
                        if (currentApplication) {
                            currentApplication.onStop();
                        }

                        applicationInfos.init = true;
                        AppContainer.register(applicationInfos);

                        applicationInfos.instance.onInit();
                        applicationInfos.instance.onStart();
                        instance = applicationInfos.instance;
                    } else {
                        currentApplication.onStop();
                        /** application already exists call resume */

                        if (applicationInfos.init !== true) {
                            applicationInfos.instance.onInit();
                            applicationInfos.instance.onStart();
                            applicationInfos.init = true;
                        } else {
                            applicationInfos.instance.onResume();
                        }

                        instance = applicationInfos.instance;
                    }
                    currentApplication = instance;
                    dfd.resolve(currentApplication);
                }
            } catch (e) {
                Api.exception.silent('ApplicationManagerException', 500013, 'An exception as been caught during ' + appname + ' launching', {error: e});
            }
            return dfd.promise();
        },

        load = function (appname, config, launchApp) {
            var def = new jQuery.Deferred(),
                doLaunchApp = (typeof launchApp === "boolean") ? launchApp : true,
                completeAppname = ['app.' + appname];
            Utils.requireWithPromise(completeAppname).done(function () {
                if (doLaunchApp) {
                    launchApplication(appname, config).done(def.resolve);
                } else {
                    def.resolve.apply(arguments);
                }
            }).fail(function () {
                def.reject('Application[' + completeAppname + '] can\'t be found');
            });
            return def.promise();
        },
        /**
         * At this stage we are sure that all apps declared in applicationConfigs was loaded
         * And that the router was loaded
         * We can then load the 'active' app
         */
        appsAreLoaded = function () {
            var activeAppConf = config.applications[config.active] || {};
            if (activeAppConf.hasOwnProperty("config")) {
                activeAppConf = activeAppConf.config;
            }
            return load(config.active, activeAppConf).then(function (app) {
                Api.Mediator.publish('on:application:ready', app);
                ApplicationManager.trigger('appIsReady', app); //use mediator
            });
        },

        reset = function () {
            //AppDefContainer = {};
            currentApplication = null;
            config = null;
            ApplicationManager.off();
            AppContainer.reset();
        },

        handleAppLoadingErrors = function (reason) {
            ApplicationManager.trigger('appError', {
                reason: reason
            });
        },

        init = function (configuration) {
            if (!configuration || !jQuery.isPlainObject(configuration)) {
                Api.exception("ApplicationManagerException", 50001, 'init expects a parameter one to be an object.');
            }
            var routePaths = [],
                routeName = '',
                appModuleName = [],
                appPaths = [],
                self = this;
            config = configuration;
            if (!config.hasOwnProperty('appPath')) {
                Api.exception('ApplicationManagerException', 50002, 'InvalidAppConfig [appPath] key is missing');
            }
            if (!config.hasOwnProperty('applications')) {
                Api.exception('ApplicationManagerException', 50003, 'InvalidAppConfig [applications] key is missing');
            }
            if (!config.hasOwnProperty("active")) {
                Api.exception('ApplicationManagerException', 50004, 'InvalidAppConfig [active] key is missing');
            }
            if (!jQuery.isPlainObject(configuration.applications)) {
                Api.exception('ApplicationManagerException', 50005, 'InvalidAppConfig [applications] should be an object');
            }
            if (underscore.size(config.applications) === 0) {
                Api.exception('ApplicationManagerException', 50006, 'InvalidAppConfig at least one application config should be provided');
            }
            jQuery.each(config.applications, function (appname, appConfig) {
                appPaths.push(config.appPath + '/' + appname + '/main.js');
                /* handle alt route path here */
                routeName = appname + '.routes';
                appModuleName.push("app." + appname);
                if (appConfig.config.hasOwnProperty('routePath') && typeof appConfig.config.routePath === 'string') {
                    routeName = appConfig.config.routePath;
                }
                routePaths.push(routeName);

                if (appConfig.hasOwnProperty('scope')) {
                    jQuery.each(appConfig.scope, function (scope, methods) {
                        Api.Scope.subscribe(
                            scope,
                            function () {
                                if (methods.open) {
                                    self.invokeService(appname + '.' + methods.open);
                                }
                            },
                            function () {
                                if (methods.open) {
                                    self.invokeService(appname + '.' + methods.close);
                                }
                            }
                        );
                    });
                }
            });
            Utils.requireWithPromise(appPaths).then(jQuery.proxy(registerAppRoutes, null, routePaths)).done(appsAreLoaded).fail(handleAppLoadingErrors);
        },

        invoke = function (actionInfos, params) {
            params = params || {};
            if (!actionInfos || ('string' !== typeof actionInfos)) {
                Api.exception('ApplicationManagerException', 50009, 'Application.invoke actionInfos should be a string');
            }
            actionInfos = actionInfos.split(':');
            if (actionInfos.length !== 3) {
                Api.exception('ApplicationManagerException', 50010, 'Invalid actionInfos. Valid format {appname}:{controllerName}:{controllerAction}');
            }
            var appPromise = launchApplication(actionInfos[0]);
            appPromise.fail(function (reason) {
                ApplicationManager.trigger("appError", {
                    reason: reason
                });
            });
            appPromise.done(function (application) {
                application.dispatchToController(actionInfos[1], actionInfos[2], params).fail(function (e) {
                    ApplicationManager.trigger("appError", {
                        reason: e
                    });
                });
            });
        },

        getAppInstance = function (appName, config) {
            config = config || {};
            if (typeof appName !== "string") {
                Api.exception("ApplicationManagerException", 50009, "appName should be a string and config should be an object");
            }
            var AppDef, appInstance = null,
                applicationInfos;
            applicationInfos = AppContainer.getByAppInfosName(appName);
            if (applicationInfos && applicationInfos.hasOwnProperty("instance")) {
                appInstance = applicationInfos.instance;
            } else {
                AppDef = AppDefContainer[appName];
                if (!AppDef) {
                    return appInstance;
                }
                appInstance = new AppDef(config);
                applicationInfos = {
                    instance: appInstance,
                    name: appName
                };
                AppContainer.register(applicationInfos);
            }
            return appInstance;
        },

        invokeService = function (servicePath) {
            var dfd = new jQuery.Deferred(),
                serviceInfos,
                appname,
                serviceName,
                params,
                appInstance,
                controllerName;
            if (!servicePath || typeof servicePath !== "string") {
                Api.exception("ApplicationManagerException", 50011, 'invokeService expects parameter one to be a string.');
            }
            params = jQuery.merge([], arguments);
            params.shift();
            serviceInfos = servicePath.split('.');
            if (serviceInfos.length !== 3) {
                Api.exception("ApplicationManagerException", 50012, '');
            }
            appname = serviceInfos[0];
            serviceName = serviceInfos[2];
            controllerName = serviceInfos[1];
            appInstance = getAppInstance(appname);
            if (appInstance) {
                appInstance.invokeControllerService(controllerName, serviceName, params).done(dfd.resolve).fail(dfd.reject);
            } else {
                /* We assume that the application has not been loaded yet */
                load(appname, {}, false).done(function () {
                    appInstance = getAppInstance(appname);
                    appInstance.invokeControllerService(controllerName, serviceName, params).done(dfd.resolve).fail(dfd.reject);
                }).fail(function (reason) {
                    ApplicationManager.trigger("appError", {
                        reason: reason
                    });
                });
            }
            return dfd.promise();
        };

    ApplicationManager = {
        registerApplication: registerApplication,
        invoke: invoke,
        invokeService: invokeService,
        launchApplication: launchApplication,
        init: init,
        reset: reset
    };
    /* application as an Event emitter */
    underscore.extend(ApplicationManager, Backbone.Events);
    Api.register('ApplicationManager', ApplicationManager);
    return ApplicationManager;
});
