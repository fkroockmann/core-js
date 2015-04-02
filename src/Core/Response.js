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
