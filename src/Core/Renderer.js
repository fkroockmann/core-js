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

            /**
             * Constructor
             * @returns {Void}
             */
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

            /**
             * Gets the selected templating engine.
             * @returns {nunjucks}
             */
            getEngine: function () {
                return this.engine;
            },

            /**
             * Add a filter to the selected templating engine.
             * @see {@link https://mozilla.github.io/nunjucks/api#Registering-custom-filters}
             * @returns {Void}
             */
            addFilter: function (name, func, async) {
                this.env.addFilter(name, func, async);
            },

            /**
             * Add a function to the selected templating engine.
             * @see {@link https://mozilla.github.io/nunjucks/templating.html#global-functions}
             * @returns {Void}
             */
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

            /**
             * Render a view from a nunjucks template with provided parameters.
             * @see {@link https://mozilla.github.io/nunjucks/api.html#renderstring}
             * @returns {String}
             * @throw {RenderException}
             */
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
