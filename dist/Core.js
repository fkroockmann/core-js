
/* src/Core.js */
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
(function () {
    'use strict';

    define('Core', [
        'Core/Api',
        'Core/ApplicationManager',
        'Core/Mediator',
        'Core/RouteManager',
        'Core/ControllerManager',
        'Core/Utils',
        'Core/Exception',
        'Core/Scope',
        'Core/Config'
    ], function (Core) {
        return Object.freeze(Core);
    });
}());
/* src/Core/Api.js */
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
define('Core/Api', [], function () {
    'use strict';

    var container = {},

        api = {
            register:  function (ctn, object) {
                if (this.hasOwnProperty(ctn)) {
                    return;
                }
                this[ctn] = object;
            },

            set: function (ctn, object) {
                this.Mediator.publish('api:set:' + ctn, object);
                container[ctn] = object;
            },

            get: function (ctn) {
                return container[ctn];
            },

            unset: function (ctn) {
                container[ctn] = null;
                delete container[ctn];
            }
        };

    return api;
});

/* src/Core/ApplicationContainer.js */
define('Core/ApplicationContainer', ['jquery', 'jsclass', 'Core/Api'], function (jQuery, coreApi) {
    'use strict';
    var instance = null,
        AppContainer;
    /**
     * AppContainer object
     */
    AppContainer = new JS.Class({
        /**
         * Container initialisation
         */
        initialize: function () {
            this.container = [];
        },
        /**
         * Register a new application
         * @param {object} applicationInfos  {
         *                                       name:"appname",
         *                                       instance:"",
         *                                       state
         *                                   }
         */
        register: function (applicationInfos) {
            if (!jQuery.isPlainObject(applicationInfos)) {
                coreApi.exception('AppContainerException', 60000, 'applicationInfos should be an object');
            }
            if (!applicationInfos.hasOwnProperty('name')) {
                coreApi.exception('AppContainerException', 60001, 'applicationInfos should have a name property');
            }
            this.container.push(applicationInfos);
        },
        /**
         * Gets application info by its name
         * @param {type} name
         * @returns {appInfos}
         */
        getByAppInfosName: function (name) {
            var result = null;
            jQuery.each(this.container, function (i, appInfos) {

                if (appInfos.name === name) {
                    result = appInfos;
                    return false;
                }
                i = i + 1;
            });
            return result;
        },
        reset: function () {
            this.container = [];
        }
    });
    return {
        getInstance: function () {
            if (!instance) {
                instance = new AppContainer();
            }
            return instance;
        }
    };
});
/* src/Core/ApplicationManager.js */
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
                this.onInit();
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
                        AppContainer.register(applicationInfos);
                        applicationInfos.instance.onInit();
                        applicationInfos.instance.onStart();
                        instance = applicationInfos.instance;
                    } else {
                        currentApplication.onStop();
                        /** application already exists call resume */
                        applicationInfos.instance.onResume();
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

/* src/Core/Config.js */
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
define('Core/Config', ['require', 'Core/Api'], function (require) {
    'use strict';

    var Core = require('Core/Api'),

        container = {},

        injectCoreConfig = function (config) {
            var key;
            for (key in config) {
                if (config.hasOwnProperty(key) && Core.hasOwnProperty(key)) {
                    try {
                        Core[key].init(config[key]);
                    } catch (e) {
                        Core.exception.silent('CoreConfigurationException', 12300, 'Config injection fail for ' + key + ' core object with message : ' + e);
                    }
                }
            }
        },

        setImutable = function (obj) {
            var key;

            for (key in obj) {
                if (obj.hasOwnProperty(key) && ('object' === typeof obj[key]) && obj[key] !== null) {
                    setImutable(obj[key]);
                }
            }

            Object.freeze(obj);
        },

        initConfig = function (config) {
            if (config.hasOwnProperty('core')) {
                injectCoreConfig(config.core);
                delete config.core;
            }

            container = config;

            setImutable(container);
        },

        find = function (sections, config) {
            var section = sections.pop();

            if (config.hasOwnProperty(section)) {
                if (sections.length > 0) {
                    return find(sections, config[section]);
                }
                return config[section];
            }
            return;
        },

        getConfig = function (namespace) {
            var sections = namespace.split(':');

            return find(sections.reverse(), container);
        };


    Core.register('initConfig', initConfig);
    Core.register('config', getConfig);
});

/* src/Core/ControllerManager.js */
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
/* src/Core/DriverHandler.js */
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
define('Core/DriverHandler', ['underscore', 'jquery', 'jsclass'], function (us, jQuery) {
    'use strict';

    /**
     *
     * @type {JS}
     */
    var DriverHandler = new JS.Class({

        /**
         * Every available actions
         * @type {Array}
         */
        AVAILABLE_ACTIONS: ['create', 'read', 'update', 'delete', 'patch', 'link'],

        /**
         * Contains every declared drivers
         * @type {Object}
         */
        drivers: {},

        /**
         * the identifier of the default driver to use
         * @type {String}
         */
        defaultDriverId: null,

        /**
         * Contains every declared 'type/action/drivers' mappings
         * @type {Object}
         */
        mappings: {},

        /**
         * Checks if driver with id provided already added
         * @param  {String}  id the driver identifier we want to check existence
         * @return {Boolean} true if driver already added, else false
         */
        hasDriver: function (id) {
            return us.contains(us.keys(this.drivers), id);
        },

        /**
         * Add provided driver with id as key if it does not exist yet
         * @param  {String} id     associated identifier of the driver we are adding
         * @param  {Object} driver the driver to add
         * @return {Object} self
         */
        addDriver: function (id, driver, isDefault) {
            if (false === this.hasDriver(id)) {
                this.drivers[id] = driver;
            }

            if (true === isDefault || null === this.defaultDriverId) {
                this.defaultDriver(id);
            }

            return this;
        },

        /**
         * Returns driver object if it is registered
         * @param  {String} id the identifier of the driver we are looking for
         * @return {Object}    the driver object if it exists, else null
         */
        getDriver: function (id) {
            var driver = null;

            if (this.hasDriver(id)) {
                driver = this.drivers[id];
            }

            return driver;
        },

        /**
         * Define the driver associated with provided id as default driver; it happens only if the driver exist
         * @param  {String} id [description]
         * @return {Object}    self
         */
        defaultDriver: function (id) {
            if (true === this.hasDriver(id)) {
                this.defaultDriverId = id;
            }

            return this;
        },

        /**
         * Add 'type/action/drivers' map into DriverHandler; it defines by type which drivers to use
         * for any action; note that this mapping is not a requirement and the fallback will use the
         * default driver
         * @param {String} type     type or namespace of your entity
         * @param {Object} mappings
         * @return {Object} DriverHandler
         */
        addActionDriverMapping: function (type, mappings) {
            var row;

            if (true === Array.isArray(mappings)) {
                for (row in mappings) {
                    if (mappings.hasOwnProperty(row)) {
                        row = mappings[row];
                        if (true === this.isValidActionDriverMapping(row)) {
                            if (false === this.mappings.hasOwnProperty(type)) {
                                this.mappings[type] = {};
                            }

                            this.mappings[type][row.action] = row;
                        }
                    }
                }
            }

            return this;
        },

        /**
         * The mapping action/drivers row is valid if:
         *     - row object has action property
         *     - row object has drivers property; drivers property is array; drivers property is not empty
         *     - row object strategy property is optionnal
         * @param  {Object}  row the mapping action/drivers row
         * @return {Boolean}     true if row has atleast action and drivers properties, else false
         */
        isValidActionDriverMapping: function (row) {
            var driver;

            if (false === row.hasOwnProperty('action') || false === row.hasOwnProperty('drivers')) {
                return false;
            }

            if (false === us.contains(this.AVAILABLE_ACTIONS, row.action)) {
                return false;
            }

            if (false === Array.isArray(row.drivers) || 0 === row.drivers.length) {
                return false;
            }

            for (driver in row.drivers) {
                if (row.drivers.hasOwnProperty(driver)) {
                    driver = row.drivers[driver];
                    if (false === this.hasDriver(driver)) {
                        return false;
                    }
                }
            }

            return true;
        },

        /**
         * Perform a create request
         * @param  {String}   type     type/namespace of your entity
         * @param  {Object}   data    contains every data required to create your entity
         */
        create: function (type, data) {
            return this.doGenericAction('create', type, {data: data});
        },

        /**
         * Perform a read request
         * @param  {String}   type      type/namespace of your entity
         * @param  {Object}   criteria
         * @param  {Object}   orderBy
         * @param  {Number}   start
         * @param  {Number}   limit
         */
        read: function (type, criteria, orderBy, start, limit) {
            return this.doGenericAction('read', type, this.formatData({}, criteria, orderBy, start, limit));
        },

        /**
         * Perform an update request
         * @param  {String}   type      type/namespace of your entity
         * @param  {Object}   data
         * @param  {Object}   criteria
         * @param  {Object}   orderBy
         * @param  {Number}   start
         * @param  {Number}   limit
         */
        update: function (type, data, criteria, orderBy, start, limit) {
            return this.doGenericAction('update', type, this.formatData(data, criteria, orderBy, start, limit));
        },

        /**
         * Perform an delete request
         * @param  {String}   type      type/namespace of your entity
         * @param  {Object}   criteria
         * @param  {Object}   orderBy
         * @param  {Number}   start
         * @param  {Number}   limit
         */
        delete: function (type, criteria, orderBy, start, limit) {
            return this.doGenericAction('delete', type, this.formatData({}, criteria, orderBy, start, limit));
        },

        /**
         * Perform an link request
         * @param  {String}   type      type/namespace of your entity
         * @param  {Object}   data
         * @param  {Object}   criteria
         * @param  {Object}   orderBy
         * @param  {Number}   start
         * @param  {Number}   limit
         */
        link: function (type, data, criteria, orderBy, start, limit) {
            return this.doGenericAction('link', type, this.formatData(data, criteria, orderBy, start, limit));
        },

        /**
         * Perform an patch request
         * @param  {String}   type      type/namespace of your entity
         * @param  {Object}   data
         * @param  {Object}   criteria
         * @param  {Object}   orderBy
         * @param  {Number}   start
         * @param  {Number}   limit
         */
        patch: function (type, data, criteria, orderBy, start, limit) {
            return this.doGenericAction('patch', type, this.formatData(data, criteria, orderBy, start, limit));
        },

        /**
         * Generate a well formated data object from criteria, orderBy,start and limit parameters
         * @param  {String} type      type/namespace of your entity
         * @param  {Object} criteria
         * @param  {Object} orderBy
         * @param  {Number} start
         * @param  {Number} limit
         * @return {Object}
         */
        formatData: function (data, criteria, orderBy, start, limit) {
            return {
                data: data,
                criteria: criteria || {},
                orderBy: orderBy || {},
                start: start || 0,
                limit: limit || null
            };
        },

        /**
         * Generic way to find action/driver mapping with type and then call handle() on every valid drivers
         * @param  {String}   action   the name of the action to execute
         * @param  {String}   type     type/namespace of your entity
         * @param  {Object}   data
         * @param  {Function} callback
         */
        doGenericAction: function (action, type, data) {
            var drivers = this.getDriversByTypeAndAction(type, action),
                driver,
                dfd = jQuery.Deferred(),
                done = function (data, response) {
                    dfd.resolve(data, response);
                },
                fail = function (e) {
                    console.log(e);
                    dfd.reject(e);
                };

            for (driver in drivers) {
                if (drivers.hasOwnProperty(driver)) {
                    this.drivers[drivers[driver]].handle(action, type, data).done(done).fail(fail);
                }
            }

            return dfd.promise();
        },

        /**
         * Allows us to retrieve drivers and its strategy by providing type and action
         * @param  {String} type   type/namespace of your entity
         * @param  {String} action the action we are looking for its drivers
         * @return {Object}
         */
        getDriversByTypeAndAction: function (type, action) {
            var drivers = null;

            if (this.mappings.hasOwnProperty(type) && this.mappings[type].hasOwnProperty(action)) {
                drivers = this.mappings[type][action].drivers;
            }

            if (null === drivers) {
                drivers = [this.defaultDriverId];
            }

            return drivers;
        },

        /**
         * Reset DriverHandler class
         */
        reset: function () {
            this.drivers = {};
            this.defaultDriverId = null;
            this.mappings = {};
        }
    });

    return new JS.Singleton(DriverHandler);
});

/* src/Core/Exception.js */
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
define('Core/Exception', ['Core/Api', 'jsclass'], function () {
    'use strict';

    /**
     * Exception is the base class for all BackBee toolbar exceptions
     */
    var Exception = new JS.Class({

            Api: require('Core/Api'),

            /**
             * Construct the exception
             */
            initialize: function (name, message, code, params) {
                this.name = name;
                this.message = message;
                this.code = code;
                this.params = params;
                this.stack = this.getStack();
            },

            /**
             * Gets the stack trace
             * @returns {array}
             */
            getStack: function () {
                var err = new Error(this.name),
                    cleanStack = [],
                    stack,
                    key;

                if (err.stack) {
                    stack = err.stack.split("\n");
                    cleanStack = stack.slice(5);

                    for (key in cleanStack) {
                        if (cleanStack.hasOwnProperty(key)) {
                            cleanStack[key] = this.parseStackLine(cleanStack[key]);
                        }
                    }
                }

                return cleanStack;
            },


            /**
             * Function to stock the Exception in Api.get('errors') and Api.get('lastError')
             * @param {Exception} error
             */
            pushError: function (error, Api) {
                if (undefined === Api.get('errors')) {
                    Api.set('errors', []);
                }

                Api.get('errors').push(error);
                Api.set('lastError', error);
            },

            /**
             * Function to parse a stak trace line
             * @param {string} line  Should be something like <call>@<file>:<lineNumber>
             * @returns {object}
             */
            parseStackLine: function (stackline) {
                var regex = /^\s*at\s+([\w\W]+)\(([\w\W]+\.js)[\w\W]*:(\d+):(\d+)\)/i,
                    values = regex.exec(stackline),
                    call = ((values && values[1]) ? values[1] : stackline),
                    file = ((values && values[2]) ? values[2] : null),
                    line = ((values && values[3]) ? values[3] : null),
                    column = ((values && values[4]) ? values[4] : null);

                return {
                    column: column,
                    line: line,
                    file: file,
                    call: call
                };
            }
        }),

        throwNewException = function (name, code, message, params) {
            name = name || 'UnknowException';
            code = code || 500;
            message = message || 'No description found for this exception.';
            params = params || {};

            var expected = new Exception(name, message, code, params);
            expected.pushError(expected, expected.Api);

            throw 'Error n ' + code + ' ' + name + ': ' + message;
        };

    throwNewException.silent = function (name, code, message, params) {
        try {
            throwNewException(name, code, message, params);
        } catch (e) {
            return e;
        }
    };

    require('Core/Api').register('exception', throwNewException);
});

/* src/Core/Mediator.js */
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
define('Core/Mediator', ['Core/Api'], function (Api) {
    'use strict';

    var Component = function topic(callback, context) {
            this.callback = callback;
            this.context = context;
        },

        Mediator = function mediator() {
            this.topics = {};
            this.publicated = {};
            this.subscribe_once = {};
        };

    /**
     * Component execution callback
     * @return {undefined}
     */
    Component.prototype.execute = function componentExecution() {
        if (this.context === undefined) {
            this.callback.apply(undefined, arguments);
        } else {
            this.callback.apply(this.context, arguments);
        }
    };

    /**
     * Subscribe to a topic
     * @param  {String}   topic    [description]
     * @param  {Function} callback [description]
     * @param  {Object}   context  [description]
     * @return {undefined}
     */
    Mediator.prototype.subscribe = function mediatorSubscribe(topic, callback, context) {
        var component = new Component(callback, context);

        if (!this.topics.hasOwnProperty(topic)) {
            this.topics[topic] = [];
        }

        this.topics[topic].push(component);

        if (this.publicated.hasOwnProperty(topic)) {
            component.execute.apply(component, this.publicated[topic].args);
        }
    };

    /**
     * Publish a topic and keep this topic in memory
     * @return {undefined}
     */
    Mediator.prototype.subscribeOnce = function mediatorSubscribeOnce(topic, callback, context) {
        if (!this.subscribe_once.hasOwnProperty(topic)) {
            this.subscribe_once[topic] = [];
        }

        this.subscribe_once[topic].push(callback);
        this.subscribe(topic, callback, context);
    };

    /**
     * Unsubscribe to a topic
     * @param  {String}   topic    [description]
     * @param  {Function} callback [description]
     * @param  {Object}   context  [description]
     * @return {undefined}
     */
    Mediator.prototype.unsubscribe = function mediatorUnsubscribe(topic, callback) {
        var i;

        if (this.topics.hasOwnProperty(topic)) {
            for (i = 0; i < this.topics[topic].length; i = i + 1) {
                if (this.topics[topic][i].callback === callback) {
                    this.topics[topic].splice(i, 1);
                }
            }
        }
    };

    /**
     * Publish a topic
     * @return {undefined}
     */
    Mediator.prototype.publish = function mediatorPublish() {
        var args = Array.prototype.slice.call(arguments),
            topic = args.shift(),
            i,
            callback;

        if (this.topics.hasOwnProperty(topic)) {
            for (i = 0; i < this.topics[topic].length; i = i + 1) {
                callback = this.topics[topic][i].callback;
                try {
                    this.topics[topic][i].execute.apply(this.topics[topic][i], args);
                } catch (e) {
                    Api.exception.silent(
                        'MediatorException',
                        12201,
                        'Mediator caught an error when the topic : "' + topic + '" was published.',
                        {
                            topic: topic,
                            context: this.topics[topic][i].context,
                            callback: this.topics[topic][i].callback,
                            args: args,
                            error: e
                        }
                    );
                }
                if (this.subscribe_once.hasOwnProperty(topic)) {
                    for (i = 0; i < this.subscribe_once[topic].length; i = i + 1) {
                        if (this.subscribe_once[topic][i] === callback) {
                            this.unsubscribe(topic, callback);
                        }
                    }
                }
            }
        }
    };

    /**
     * Publish a topic and keep this topic in memory
     * @return {undefined}
     */
    Mediator.prototype.persistentPublish = function mediatorPersistentPublish() {
        var args = Array.prototype.slice.call(arguments),
            topic = args.shift();

        this.publish.apply(this, arguments);

        this.publicated[topic] = {
            args: args
        };
    };

    /**
     * Remove a topic publish
     * @param  {String} topic [description]
     * @return {undefined}
     */
    Mediator.prototype.removePublish = function mediatorRemovePublication(topic) {
        this.publicated[topic] = null;
        delete this.publicated[topic];
    };

    Api.register('Mediator', new Mediator());
});


/* src/Core/Renderer.js */
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
define('Core/Renderer', ['require', 'nunjucks', 'Core', 'jquery', 'Core/Utils', 'jsclass'], function (require, nunjucks, Core) {
    'use strict';

    var jQuery = require('jquery'),

        config = {},

        instance,

        Renderer = new JS.Class({
            initialize: function () {
                var error_tpl = config.error_tpl || '<p>Error while loading template</p>',
                    placeholder = config.placeholder || '<p>Loading...</p>';
                this.env = nunjucks.configure({ watch: false });
                this.engine = nunjucks;
                this.render_action = 'html';
                this.error_msg = jQuery(error_tpl).clone();
                this.placeholder = jQuery(placeholder);
                this.functions = {};
            },

            getEngine: function () {
                return this.engine;
            },

            addFilter: function (name, func, async) {
                this.env.addFilter(name, func, async);
            },

            addFunction: function (name, func) {
                if (typeof func === 'function') {
                    this.functions[name] = func;
                }
            },

            mergeParameters: function (params) {
                var key;

                if (!params) {
                    params = {};
                }

                for (key in this.functions) {
                    if (this.functions.hasOwnProperty(key)) {
                        params[key] = this.functions[key];
                    }
                }

                return params;
            },

            /**
             * @todo: this seems to no work.
             */
            asyncRender: function (path, params, config) {
                params = this.mergeParameters(params);
                config = config || {};
                config.placeholder = config.placeholder || this.placeholder;
                config.action = config.action || 'html';
                if (!path || typeof path !== "string") {
                    throw 'Renderer:asyncRender [path] parameter should be a string';
                }
                require('Core/Utils').requireWithPromise(['text!' + path]).then(
                    jQuery.proxy(this.onTemplateReady, this, config, params),
                    jQuery.proxy(this.errorRenderer, this, config)
                );

                return jQuery(config.placeholder);
            },

            render: function (template, params) {
                params = this.mergeParameters(params);
                try {
                    return this.engine.renderString(template, params);
                } catch (e) {
                    Core.exception('RenderException', 500, e.message, {engineException: e, template: template, params: params});
                }
            },

            errorRenderer: function (config) {
                jQuery(config.placeholder)[config.action](this.error_msg);
            },

            onTemplateReady: function (config, params, template) {
                jQuery(config.placeholder)[config.action](this.engine.renderString(template, params));
            }
        }),

        getInstance = function () {
            if (instance === undefined) {
                instance = new Renderer();
            }
            return instance;
        },

        initRenderer = function (conf) {
            config = conf;
        },

        invokeMethod = function (method_name) {
            return (function (instance) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    return instance[method_name].apply(instance, args);
                };
            }(getInstance()));
        },

        ApiRender = {
            init: initRenderer,
            getEngine: invokeMethod('getEngine'),
            render: invokeMethod('render'),
            asyncRender: invokeMethod('asyncRender'),
            addFilter: invokeMethod('addFilter'),
            addFunction: invokeMethod('addFunction')
        };

    return ApiRender;
});

/* src/Core/Request.js */
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
define('Core/Request', ['jsclass'], function () {
    'use strict';

    /**
     * Request object
     */
    var Request = new JS.Class({

        initialize: function () {
            /**
             * Uri of request
             * @type {String}
             */
            this.url = '';
            /**
             * Method of request
             * @type {String}
             */
            this.method = 'GET';
            /**
             * Data of request
             * @type {Mixed}
             */
            this.data = null;
            /**
             * Headers of request
             * @type {Object}
             */
            this.headers = {
                'Content-Type': 'application/x-www-form-uriencoded'
            };

        },

        /**
         * Set url of request
         * @param {String} url
         * @returns {Object} Request
         */
        setUrl: function (url) {
            this.url = url;

            return this;
        },
        /**
         * Set the method of request
         * @param {String} method
         * @returns {Object} Request
         */
        setMethod: function (method) {
            this.method = method.toUpperCase();

            return this;
        },
        /**
         * @param {Mixed} data
         * @returns {Object} Request
         */
        setData: function (data) {
            this.data = data;

            return this;
        },
        /**
         * Set all headers in request
         * @param {Object} headers
         * @returns {Object} Request
         */
        setHeaders: function (headers) {
            this.headers = headers;

            return this;
        },
        /**
         * Set one header with name and value
         * @param {String} name
         * @param {String} value
         * @returns {Object} Request
         */
        addHeader: function (name, value) {
            this.headers[name] = value;

            return this;
        },
        /**
         * Set content type of request
         * @param {String} contentType
         * @returns {Object} Request
         */
        setContentType: function (contentType) {
            this.addHeader('Content-Type', contentType);
            return this;
        },
        /**
         * Get the url with query params
         * @returns {String} url builded
         */
        getUrl: function () {
            return this.url;
        },
        /**
         * Get the content type of request
         * @returns {String}
         */
        getContentType: function () {
            return this.headers['Content-Type'];
        },
        /**
         * GEt the method of request
         * @returns {String}
         */
        getMethod: function () {
            return this.method;
        },
        /**
         * Get the data of request
         * @returns {Mixed}
         */
        getData: function () {
            return this.data;
        },
        /**
         * Get header by key
         * @param {String} key
         * @returns {Object|null}
         */
        getHeader: function (key) {
            return this.headers[key] || null;
        },
        /**
         * Get the headers of request
         * @returns {Object}
         */
        getHeaders: function () {
            return this.headers;
        }
    });

    return Request;
});

/* src/Core/RequestHandler.js */
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
define('Core/RequestHandler', ['Core/Api', 'jquery', 'underscore', 'BackBone', 'Core/Response', 'jsclass'], function (Api, jQuery, Underscore, Backbone, CoreResponse) {
    'use strict';

    /**
     * RequestHandler object
     */
    var RequestHandler = new JS.Class({

        /**
         * Initialize of RequestHandler
         */
        initialize: function () {
            Underscore.extend(this, Backbone.Events);
        },

        /**
         * Send the request to the server and build
         * a Response object
         * @returns Response
         */
        send: function (request) {
            var self = this,
                dfd = jQuery.Deferred();

            if (null !== request) {

                Api.Mediator.publish('request:send:before', request);

                jQuery.ajax({
                    url: request.getUrl(),
                    type: request.getMethod(),
                    data: request.getData(),
                    headers: request.getHeaders()
                }).done(function (data, textStatus, xhr) {
                    var response = self.buildResponse(
                            xhr.getAllResponseHeaders(),
                            data,
                            xhr.responseText,
                            xhr.status,
                            textStatus,
                            ''
                        );

                    Api.Mediator.publish('request:send:done', response);

                    dfd.resolve(response.getData(), response);
                }).fail(function (xhr, textStatus, errorThrown) {
                    var response = self.buildResponse(
                            xhr.getAllResponseHeaders(),
                            '',
                            xhr.responseText,
                            xhr.status,
                            textStatus,
                            errorThrown
                        );

                    Api.Mediator.publish('request:send:fail', response);

                    dfd.reject(response.getData(), response);
                });
            }

            return dfd.promise();
        },

        /**
         * Build the Response Object
         * @param {String} headers
         * @param {String} data
         * @param {String} rawData
         * @param {Number} status
         * @param {String} statusText
         * @param {String} errorText
         */
        buildResponse: function (headers, data, rawData, status, statusText, errorText) {
            var Response = new CoreResponse();

            this.buildHeaders(Response, headers);

            Response.setData(data);
            Response.setRawData(rawData);
            Response.setStatus(status);
            Response.setStatusText(statusText);
            Response.setErrorText(errorText);

            return Response;
        },

        /**
         * Build String headers, split \r to have all key/value
         * and split each with ":" for have a key and value
         * and use addHeader function to set each header
         * @param {Object} Response
         * @param {String} headers
         */
        buildHeaders: function (Response, headers) {
            var headersSplit,
                header,
                name,
                value,
                key,
                identifierPos;

            headersSplit = headers.split('\r');
            for (key in headersSplit) {
                if (headersSplit.hasOwnProperty(key)) {
                    header = headersSplit[key];
                    identifierPos = header.indexOf(':');
                    if (-1 !== identifierPos) {
                        name = header.substring(0, identifierPos).trim();
                        value = header.substring(identifierPos + 1).trim();
                        Response.addHeader(name, value);
                    }
                }
            }
        }
    });

    return new JS.Singleton(RequestHandler);
});

/* src/Core/Response.js */
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
define('Core/Response', ['jsclass'], function () {
    'use strict';

    /**
     * Response object
     */
    var Response = new JS.Class({

        /**
         * Initialize of Response
         */
        initialize: function () {
            /**
            * Headers of Response
            * @type {Object}
            */
            this.headers = {};

            /**
            * Mixed data value of Response
            * @type {Mixed}
            */
            this.data = '';

            /**
            * Raw data of Response
            * @type {String}
            */
            this.rawData = '';

            /**
            * Status code of Response
            * @type {Number}
            */
            this.status = 200;

            /**
            * Status text of Response
            * @type {String}
            */
            this.statusText = '';

            /**
            * Error text of Response
            * @type {String}
            */
            this.errorText = '';
        },

        /**
         * return all headers of Response
         * @returns {Object}
         */
        getHeaders: function () {
            return this.headers;
        },

        /**
         * Return one header by key
         * @param {String} key
         * @returns {String|null}
         */
        getHeader: function (key) {
            return this.headers[key] || null;
        },

        /**
         * Return data, if data not set it
         * will return data raw
         * @returns {Mixed}
         */
        getData: function () {
            if ('' === this.data) {
                return this.rawData;
            }

            return this.data;
        },

        /**
         * Return raw datas
         * @returns {String}
         */
        getRawData: function () {
            return this.rawData;
        },

        /**
         * Return status code
         * @returns {Number}
         */
        getStatus: function () {
            return this.status;
        },

        /**
         * Return status text
         * @returns {String}
         */
        getStatusText: function () {
            return this.statusText;
        },

        /**
         * Return error text
         * @returns {String}
         */
        getErrorText: function () {
            return this.errorText;
        },

        getUidFromLocation: function () {
            var locationHeader = this.getHeader('Location'),
                res,
                regex;

            if (null === locationHeader) {
                return null;
            }

            regex = new RegExp('[\/]([a-f0-9]{32}$)');

            res = regex.exec(locationHeader);

            return res[1];
        },

        /**
         * Get range from
         *
         * @returns {Numeric}
         */
        getRangeFrom: function () {
            var rangeHeader = this.getHeader('Content-Range'),
                res;
            if (null === rangeHeader) {
                return null;
            }

            res = rangeHeader.split('-');
            if (res[0] === undefined) {
                return null;
            }

            return parseInt(res[0], 10);
        },

        /**
         * Get range to
         *
         * @returns {Numeric}
         */
        getRangeTo: function () {
            var rangeHeader = this.getHeader('Content-Range'),
                res,
                res2;

            if (null === rangeHeader) {
                return null;
            }

            res = rangeHeader.split('/');
            if (res[0] === undefined) {
                return null;
            }

            res2 = res[0].split('-');
            if (res2[1] === undefined) {
                return null;
            }

            return parseInt(res2[1], 10);
        },

        /**
         * Get range last
         *
         * @returns {Numeric}
         */
        getRangeTotal: function () {
            var rangeHeader = this.getHeader('Content-Range'),
                res;

            if (null === rangeHeader) {
                return null;
            }

            res = rangeHeader.split('/');
            if (res[1] === undefined) {
                return null;
            }

            return parseInt(res[1], 10);
        },

        /**
         * Set all headers as object
         * @param {Object} headers
         * @returns Response
         */
        setHeaders: function (headers) {
            this.headers = headers;

            return this;
        },

        /**
         * Add one header by name and value
         * @param {String} name
         * @param {String} value
         * @returns {Response}
         */
        addHeader: function (name, value) {
            this.headers[name] = value;

            return this;
        },

        /**
         * Set the data
         * @param {String} data
         * @returns {Response}
         */
        setData: function (data) {
            this.data = data;

            return this;
        },

        /**
         * Set the raw data
         * @param {String} rawData
         * @returns {Response}
         */
        setRawData: function (rawData) {
            this.rawData = rawData;

            return this;
        },

        /**
         * Set the status code
         * @param {Number} status
         * @returns {Response}
         */
        setStatus: function (status) {
            this.status = status;

            return this;
        },

        /**
         * Set the status text
         * @param {String} statusText
         * @returns {Response}
         */
        setStatusText: function (statusText) {
            this.statusText = statusText;

            return this;
        },

        /**
         * Set the error text
         * @param {String} errorText
         * @returns {Response}
         */
        setErrorText: function (errorText) {
            this.errorText = errorText;

            return this;
        }
    });

    return Response;
});

/* src/Core/RestDriver.js */
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
define('Core/RestDriver', ['Core/Request', 'Core/RequestHandler', 'URIjs/URI', 'Core', 'jsclass'], function (Request, RequestHandler, URI, Core) {
    'use strict';

    var RestDriver = new JS.Class({
            /**
             * RestDriver constructor, we initialize the Request object with a default content type
             */
            initialize: function () {
                /**
                 * The REST api base url (example: /rest/1/)
                 * @type {String}
                 */
                this.baseUrl = ''; // retrieve it from core?

                /**
                 * Request object used to build every REST request
                 * @type {Object}
                 */
                this.request = null;

                // Lack of authentification process to add to request header
            },

            /**
             * BaseUrl property setter
             * @param {String} baseUrl the driver new base url
             */
            setBaseUrl: function (baseUrl) {
                this.baseUrl = baseUrl;
            },

            /**
             * Handle every user request and decide what kind of HTTP request to build depending on action and return
             * the response provided by server
             * @param  {String} action the action to execute ('read', 'create', 'delete', 'update', 'patch', 'link')
             * @param  {String} type   your entity namespace
             * @param  {Object} data  data contains request limit, start, criteria and data
             * @return {Object}        the response data provided by performing your request
             */
            handle: function (action, type, data) {
                var url = new URI(this.baseUrl),
                    range;

                this.request = new Request();
                this.request.headers = {};
                this.request.setContentType('application/json');
                this.request.addHeader('Accept', 'application/json');

                url.segment(type);

                if ('read' === action) {
                    this.request.setMethod('GET');
                    this.computeCriteria(url, data);
                } else if ('update' === action || 'patch' === action || 'link' === action || 'delete' === action) {
                    this.request.setMethod('update' === action ? 'put' : action);
                    this.computeCriteria(url, data);

                    if (data.hasOwnProperty('data')) {
                        if ('patch' === action) {
                            this.request.setData(this.computePatchOperations(data.data));
                        } else {
                            this.request.setData(data.data);
                        }
                    }
                } else if ('create' === action) {
                    this.request.setMethod('POST');
                    this.computeCriteria(url, data);

                    if (data.hasOwnProperty('data')) {
                        this.request.setData(data.data);
                    }
                }

                if (data.hasOwnProperty('limit') && null !== data.limit) {
                    range = (data.hasOwnProperty('start') ? data.start : '0') + ',' + data.limit;
                    this.request.addHeader('Range',  range);
                }

                this.computeOrderBy(url, data);

                this.request.setUrl(url.normalize().toString());

                if (null !== this.request.getData()) {
                    this.request.setData(JSON.stringify(this.request.getData()));
                }

                Core.Mediator.publish('rest:send:before', this.request);

                return RequestHandler.send(this.request);
            },

            /**
             * Checks if data has criteria and add them to url
             * @param  {Object} url   object which must be type of URI which represent the request url
             * @param  {Object} data
             * @return {Object}       self
             */
            computeCriteria: function (url, data) {
                var criteria = data.hasOwnProperty('criteria') ? data.criteria : null,
                    criterion;

                if (null === criteria) {
                    return this;
                }

                for (criterion in criteria) {
                    if (criteria.hasOwnProperty(criterion)) {
                        if ('uid' === criterion || 'id' === criterion) {
                            url.segment(criteria[criterion].toString());
                        } else {
                            url.addSearch(criterion + (typeof criteria[criterion] === 'object' ? '[]' : ''), criteria[criterion]);
                        }
                    }
                }

                return this;
            },

            /**
             * Checks if data has orderBy and add them to url
             * @param  {Object} url   object which must be type of URI which represent the request url
             * @param  {Object} data
             * @return {Object}       self
             */
            computeOrderBy: function (url, data) {
                var order;

                if (data.hasOwnProperty('orderBy') && typeof data.orderBy === 'object') {
                    for (order in data.orderBy) {
                        if (data.orderBy.hasOwnProperty(order)) {
                            url.addSearch('order_by[' + order + ']', data.orderBy[order]);
                        }
                    }
                }

                return this;
            },

            /**
             * Format request data to match with path operations standard (RFC 6902: http://tools.ietf.org/html/rfc6902)
             * @param  {Object} data patch raw data
             * @return {Object}       formatted patch data
             */
            computePatchOperations: function (data) {
                var operations = [],
                    key;

                for (key in data) {
                    if (data.hasOwnProperty(key)) {
                        operations.push({
                            op: 'replace',
                            path: '/' + key,
                            value: data[key]
                        });
                    }
                }

                return operations;
            }
        }),
        rest = new RestDriver();

    return {

        /**
         * Handle every user request and decide what kind of HTTP request to build depending on action and return
         * the response provided by server
         * @param  {String} action the action to execute ('read', 'create', 'delete', 'update', 'patch', 'link')
         * @param  {String} type   your entity namespace
         * @param  {Object} data   data contains request limit, start, criteria and data
         * @return {Object}        the response data provided by performing your request
         */
        handle: function (action, type, data) {
            return rest.handle(action, type, data);
        },

        /**
         * BaseUrl property setter
         * @param {String} baseUrl the new base url
         */
        setBaseUrl: function (baseUrl) {
            rest.setBaseUrl(baseUrl);

            return this;
        }
    };
});
/* src/Core/RouteManager.js */
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
define('Core/RouteManager', ['jquery', 'Core/Api', 'BackBone', 'Core/ApplicationManager', 'jsclass'], function (jQuery, Api, BackBone) {
    'use strict';
    var bbApplicationManager = require('Core/ApplicationManager'),

        //use the mediator to avoid a circular dependency
        routesCollections = {},

        /**
         * Router handle routes -> dispatch to application manager
         * Application manager
         **/
        Router = new JS.Class({

            /**
             * Router's constructor
             */
            initialize: function () {
                var ExtRouter = BackBone.Router.extend({
                    execute: function (callback, args) {
                        if (typeof callback === 'function') {
                            callback.apply(this, args);
                        }
                    }
                });

                this.routes = {};
                this.mainRouter = new ExtRouter({});
                this.handleApplicationLinks();
            },

            /**
             * Enable listener on click of every body a tags
             */
            handleApplicationLinks: function () {
                /* si href ne rien faire */
                var self = this,
                    url,
                    routeInfos;

                jQuery("body").delegate("a", "click", function (e) {
                    var action = jQuery(this).data("action");
                    if ("string" === typeof action) {
                        e.preventDefault();
                        routeInfos = routesCollections[action]; // layout:home
                        if (!jQuery.isPlainObject(routeInfos)) {
                            throw "RouteManager:handleApplicationLinks route " + action + " can't be found";
                        }

                        url = self.buildLink(action);
                        self.navigate(url);
                    }
                });
            },

            /**
             * Builds with linkParams and returns the path according to routeName
             *
             * @param  {String} routeName
             * @param  {Object} linkParams
             *
             * @return {String}
             */
            buildLink: function (routeName, linkParams) {
                var routeInfos,
                    link;

                if (false === routesCollections.hasOwnProperty(routeName)) {
                    throw 'RouteManager:buildLink routeInfos can\'t be found';
                }

                routeInfos = routesCollections[routeName];
                linkParams = linkParams || routeInfos.defaults;
                link = routeInfos.url;
                if (routeInfos.hasOwnProperty("defaults")) {
                    jQuery.each(routeInfos.defaults, function (key, value) {
                        link = link.replace(key, value);
                    });
                }

                return link;
            },

            /**
             * Navigate to path and invoke the right action
             *
             * @param  {String}  path
             * @param  {Boolean} triggerEvent
             * @param  {Boolean} updateRoute
             */
            navigate: function (path, triggerEvent, updateRoute) {
                var conf = {
                    trigger: triggerEvent || true,
                    replace: updateRoute || true
                };
                this.mainRouter.navigate(path, conf);
            },

            /**
             * It acts like the FrontController and invoke the right controller
             *
             * @param  {Object} actionInfos
             */
            genericRouteHandler: function (actionInfos) {
                var params = jQuery.merge([], arguments);
                params.pop();
                bbApplicationManager.invoke(actionInfos, params);
            },

            /**
             * Register routeInfos into BackBee router
             *
             * @param  {Object} routeInfos
             */
            registerRoute: function (routeInfos) {
                var actionsName = routeInfos.completeName.split(':');
                actionsName = actionsName[0];
                this.mainRouter.route(routeInfos.url, routeInfos.completeName, jQuery.proxy(this.genericRouteHandler, this, actionsName + ':' + routeInfos.action));
            }

        }),
        routerInstance = new Router(),
        RouteManager = {

            /**
             * Initialize RouteManager and start BackBone history component
             *
             * @param  {Object} conf
             * @return {Object} self
             */
            initRouter: function (conf) {
                conf = conf || {};
                BackBone.history.start(conf);

                return this;
            },

            /**
             * Register application's routes into RouteManager; a routeConfig object must look like:
             *
             * {
             *     prefix: 'YOUR_PREFIX', // optionnal
             *     routes: {
             *         home: {
             *             url: 'URL_PATTERN', // example: /foo/bar, you can also have dynamic parameter like: /foo/bar/1, /foo/bar/2, etc. the associated pattern is: /foo/bar/:page
             *             action: '',
             *             defaults: { // defaults key is optionnal
             *                  ":page": 1
             *             }
             *         }
             *     }
             * }
             *
             * @param  {String} appname
             * @param  {Object} routeConf
             */
            registerRoute: function (appname, routeConf) {
                var routes = routeConf.routes,
                    prefix = '',
                    url = '';

                if (!routeConf.hasOwnProperty('routes')) {
                    throw 'A routes key must be provided';
                }

                if (!jQuery.isPlainObject(routeConf.routes)) {
                    throw 'Routes must be an object';
                }

                if (typeof routeConf.prefix === 'string') {
                    prefix = routeConf.prefix;
                }

                jQuery.each(routes, function (name, routeInfos) {
                    if (!jQuery.isPlainObject(routeInfos)) {
                        throw name + ' route infos must be an object';
                    }

                    if (!routeInfos.hasOwnProperty('url')) {
                        throw name + ' route infos must have `url` property';
                    }

                    if (!routeInfos.hasOwnProperty('action')) {
                        throw name + ' route infos must have `action` property';
                    }

                    if (prefix.length !== 0) {
                        url = (routeInfos.url.indexOf('/') === 0) ? routeInfos.url.substring(1) : routeInfos.url;
                        routeInfos.url = prefix + '/' + url;
                    }

                    routeInfos.completeName = appname + ':' + name;

                    routesCollections[routeInfos.completeName] = routeInfos;
                    routerInstance.registerRoute(routeInfos);
                });
            },

            /**
             * Navigate to path and invoke the associated action (alias of this.navigateByPath() to maintain
             * compatibility)
             *
             * @param  {Object}  path
             * @param  {Boolean} triggerEvent
             * @param  {Boolean} updateRoute
             */
            navigate: function (path, triggerEvent, updateRoute) {
                this.navigateByPath(path, triggerEvent, updateRoute);
            },

            /**
             * Navigate to path and invoke the associated action
             *
             * @param  {Object}  path
             * @param  {Boolean} triggerEvent
             * @param  {Boolean} updateRoute
             */
            navigateByPath: function (path, triggerEvent, updateRoute) {
                routerInstance.navigate(path, triggerEvent, updateRoute);
            },

            /**
             * [navigateByName description]
             * @param  {String}  name
             * @param  {Boolean} triggerEvent
             * @param  {Boolean} updateRoute
             */
            navigateByName: function (name, triggerEvent, updateRoute) {
                this.navigateByPath(routerInstance.buildLink(name), triggerEvent, updateRoute);
            }
        };

    Api.register('RouteManager', RouteManager);

    return RouteManager;
});

/* src/Core/Scope.js */
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
 * @category    Core
 * @package     Scope
 * @copyright   Lp digital system
 * @author      n.dufreche <nicolas.dufreche@lp-digital.fr>
 */
define('Core/Scope', ['Core/Api', 'underscore'], function (Api, Under) {
    'use strict';

    var Scope = function scope() {
            this.scopes = [];
            Api.Mediator.subscribeOnce('on:application:ready', function () {
                Api.Mediator.persistentPublish('scope:global:opening');
            });
        },

        /**
         * Open and  close scope
         * @param  {Array} scopes
         * @param  {boolean} opening
         * @return {false}
         */
        toggle = function scopesToggle(scopes, opening) {
            var i;
            for (i = 0; i < scopes.length; i = i + 1) {
                if (opening === true) {
                    Api.Mediator.publish('scope:' + scopes[i].toLowerCase() + ':opening');
                } else {
                    Api.Mediator.publish('scope:' + scopes[i].toLowerCase() + ':closing');
                }
            }
        },

        checkScope = function scopeCheck(scopes) {
            var i;
            for (i = 0; i < scopes.length; i = i + 1) {
                if ('string' !== typeof scopes[i]) {
                    Api.exception('ScopeException', 12101, 'All scope have to be a string.');
                }
            }
        };

    /**
     * Register new scope and close actually scopes open
     * @return {false}
     */
    Scope.prototype.register = function scopeRegister() {
        var openingScopes = Under.difference(arguments, this.scopes),
            closingScopes = Under.difference(this.scopes, arguments);

        checkScope(arguments);

        toggle(closingScopes, false);
        toggle(openingScopes, true);

        this.scopes = Under.difference(this.scopes, closingScopes);
        this.scopes = Under.union(this.scopes, openingScopes);
    };

    /**
     * Open a scope
     * @param  {String} scope
     * @return {false}
     */
    Scope.prototype.open = function scopeOpen(scope) {
        var index = Under.indexOf(this.scopes, scope);

        checkScope([scope]);

        if (-1 === index) {
            toggle([scope], true);
            this.scopes.push(scope);
        }
    };

    /**
     * Close a scope
     * @param  {String} scope
     * @return {false}
     */
    Scope.prototype.close = function scopeClose(scope) {
        var index = Under.indexOf(this.scopes, scope);

        checkScope([scope]);

        if (-1 !== index) {
            toggle([scope], false);
            this.scopes = Under.without(this.scopes, scope);
        }
    };

    /**
     * Subscribe to scope
     * @param  {String} scope
     * @param  {Function} openingCallback
     * @param  {Function} closingCallback
     * @return {false}
     */
    Scope.prototype.subscribe = function scopeSuscribe(scope, openingCallback, closingCallback) {
        var index = Under.indexOf(this.scopes, scope.toLowerCase());

        if ('string' !== typeof scope || 'function' !== typeof openingCallback || 'function' !== typeof closingCallback) {
            Api.exception('ScopeException', 12102, 'Scope subscription was incorrect.');
        }

        if (-1 !== index) {
            try {
                openingCallback.apply(undefined);
            } catch (e) {
                Api.exception.silent('ScopeException', 12103, 'Error while running Opening callback in scope "' + scope + '"" with message: ' + e);
            }
        }

        Api.Mediator.subscribe('scope:' + scope.toLowerCase() + ':opening', openingCallback);
        Api.Mediator.subscribe('scope:' + scope.toLowerCase() + ':closing', closingCallback);
    };

    Api.register('Scope', new Scope());
});

/* src/Core/Utils.js */
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
define('Core/Utils', ['jquery', 'Core/Api'], function (jQuery, Api) {
    'use strict';
    /**
     * Simple data container with action events
     * Events : [onInit, onAdd, onChange, onReplace, onDestroy, onDelete]
     *
     **/
    var SmartList = function SmartList(config) {
            this.dataContainer = {};
            this.itemCount = 0;
            this.idKey = null;
            this.maxEntry = null;
            /*events*/
            this.onChange = function () {
                return;
            };
            this.onDestroy = function () {
                return;
            };
            this.onInit = function () {
                return;
            };
            this.onAdd = function () {
                return;
            };
            this.onReplace = function () {
                return;
            };
            this.onDelete = function () {
                return;
            };
            if (typeof this.init !== 'function') {
                this.init = function (config) {
                    if (config && !config.hasOwnProperty("idKey")) {
                        throw "SmartList:init if a config param is provided a config.idKey is expected";
                    }
                    config = config || {};
                    this.name = config.name || 'list_' + new Date().getTime();
                    var data = config.data || {};
                    this.onChange = ((typeof config.onChange === 'function') ? config.onChange : this.onChange);
                    this.onDestroy = ((typeof config.onDestroy === 'function') ? config.onDestroy : this.onDestroy);
                    if (config.idKey) {
                        this.idKey = config.idKey;
                    }
                    this.onInit = ((typeof config.onInit === 'function') ? config.onInit : this.onInit);
                    this.onAdd = ((typeof config.onAdd === 'function') ? config.onAdd : this.onAdd);
                    this.onReplace = ((typeof config.onReplace === 'function') ? config.onReplace : this.onReplace);
                    this.onDelete = ((typeof config.onDelete === 'function') ? config.onDelete : this.onDelete);
                    if (config.maxEntry) {
                        this.maxEntry = parseInt(config.maxEntry, 10);
                    }
                    this.setData(data);
                    this.itemCount = this.getSize();
                };
            }
            /**
             * Set max entry into the Smartlist
             * @param {number} maxEntry [max entry authorized]
             */
            SmartList.prototype.setMaxEntry = function (maxEntry) {
                this.maxEntry = maxEntry || null;
            };
            /**
             * Setter
             * @param {string} key   [value identifier]
             * @param {mixed}  value [value]
             */
            SmartList.prototype.set = function (key, value) {
                if (this.idKey && !jQuery.isPlainObject(key)) {
                    throw "SmartList:set item should be an object when and idKey is set";
                }
                if (this.idKey && jQuery.isPlainObject(key)) {
                    if (!key.hasOwnProperty(this.idKey)) {
                        throw "SmartList:set should have a key " + this.idKey;
                    }
                    value = key;
                    key = key[this.idKey];
                }

                if (!this.dataContainer.hasOwnProperty(key)) {
                    var bound = this.itemCount + 1;
                    if (this.maxEntry && (bound > this.maxEntry)) {
                        return;
                    }
                    this.itemCount = bound;
                }
                this.dataContainer[key] = value;
                this.onChange(this.dataContainer, this.name, value);
            };
            /**
             * Getter
             * @param  {string} key [value identifier]
             * @return {mixed}      [value]
             */
            SmartList.prototype.get = function (key) {
                return this.dataContainer[key] || false;
            };
            /**
             * Destroy the Smartlist
             */
            SmartList.prototype.destroy = function () {
                var self = this;
                this.dataContainer = {};
                this.itemCount = 0;
                this.onDestroy(self);
            };
            /**
             * Reset the Smartlist
             */
            SmartList.prototype.reset = function () {
                this.destroy();
            };
            /**
             * Get all datas
             * @return {object} [the data container]
             */
            SmartList.prototype.getData = function () {
                return this.dataContainer;
            };
            /**
             * Transform the data container into an Array
             * @param  {boolean} clear [true if you want a clean array]
             * @return {array}         [data conainer as array]
             */
            SmartList.prototype.toArray = function (clear) {
                var self = this,
                    cleanData = [];
                if (clear) {
                    jQuery.each(this.dataContainer, function (key) {
                        cleanData.push(self.dataContainer[key]);
                    });
                } else {
                    cleanData = jQuery.makeArray(this.dataContainer);
                }
                return cleanData;
            };
            /**
             * Replace item
             * @param  {[type]} item [description]
             * @return {[type]}      [description]
             */
            SmartList.prototype.replaceItem = function (item) {
                if (!arguments.length) {
                    throw "SmartList:replaceItem expects one parameter";
                }
                if (!item.hasOwnProperty(this.idKey)) {
                    throw "SmartList:deleteItem [item] should have a [" + this.idKey + "] key";
                }
                this.dataContainer[item[this.idKey]] = item;
                this.onReplace(this.dataContainer, this.name, item);
            };
            /**
             * Delete Item
             * @param  {[type]} item [description]
             * @return {[type]}      [description]
             */
            SmartList.prototype.deleteItem = function (item) {
                if (!arguments.length) {
                    throw "SmartList:replaceItem expects one parameter";
                }
                if (!jQuery.isPlainObject(item)) {
                    throw "SmartList:deleteItem [item] should be a object";
                }
                if (!item.hasOwnProperty(this.idKey)) {
                    throw "SmartList:deleteItem [item] should have a [" + this.idKey + "] key";
                }
                delete this.dataContainer[item[this.idKey]];
                this.itemCount = this.itemCount - 1;
                this.onDelete(this.dataContainer, this.name, item);
            };
            /**
             * Delete item by identifier
             * @param  {string} identifier [description]
             */
            SmartList.prototype.deleteItemById = function (identifier) {
                if (!this.dataContainer.hasOwnProperty(identifier)) {
                    return false;
                }
                delete this.dataContainer[identifier];
                this.itemCount = this.itemCount - 1;
                this.onDelete(this.dataContainer, this.name, identifier);
            };
            /**
             * Set data
             * @param {mixed}  data  [Data to store]
             */
            SmartList.prototype.setData = function (data) {
                var item,
                    self = this;
                if (!data) {
                    throw "SmartList:setData data must be provided";
                }
                if (jQuery.isArray(data)) {
                    if (!this.idKey) {
                        throw "SmartList:setData idKey must be provided";
                    }
                    jQuery.each(data, function (i) {
                        item = data[i];
                        if (item.hasOwnProperty(self.idKey)) {
                            self.set(item);
                        }
                    });
                } else {
                    this.dataContainer = data;
                }
                this.onInit(this.dataContainer);
            };
            /**
             * Add data
             * @param {mixed} data [Data to store]
             */
            SmartList.prototype.addData = function (data) {
                var self = this,
                    item,
                    items = [];
                if (jQuery.isArray(data)) {
                    if (!this.idKey) {
                        throw "SmartList:addData idKey must be provided";
                    }
                    jQuery.each(data, function (i) {
                        item = data[i];
                        if (item.hasOwnProperty(self.idKey)) {
                            self.set(item);
                            items.push(item);
                        }
                    });
                } else {
                    this.dataContainer = jQuery.extend(true, this.dataContainer, data);
                }
                this.onAdd(items);
            };
            /**
             * Get Smartlist size
             * @return {number} [the object size]
             */
            SmartList.prototype.getSize = function () {
                var items = this.toArray(true);
                return items.length;
            };
            return this.init(config);
        },
        /**
         * require with Promise
         * @param  {[type]} dep [description]
         * @return {[type]}     [description]
         */
        requireWithPromise = function (dep, keepRequireContext) {
            var def = new jQuery.Deferred();
            if (keepRequireContext) {

                dep.splice(0, 0, 'require');

                require(dep, function (req) {
                    def.resolve.call(this, req);
                }, function (reason) {
                    def.reject(reason);
                });
            } else {
                require(dep, function () {
                    def.resolve.apply(this, arguments);
                }, function (reason) {
                    def.reject(reason);
                });
            }
            return def.promise();
        },

        castAsArray = function (values) {
            if (values instanceof Object && !(values instanceof Array)) {
                values = Object.keys(values).map(
                    function (key) {
                        return values[key];
                    }
                );
            }
            return values;
        };

    Api.register('SmartList', SmartList);
    return {
        SmartList: SmartList,
        requireWithPromise: requireWithPromise,
        castAsArray: castAsArray
    };
});