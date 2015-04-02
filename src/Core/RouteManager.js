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
