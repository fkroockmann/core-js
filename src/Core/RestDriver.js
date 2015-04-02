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