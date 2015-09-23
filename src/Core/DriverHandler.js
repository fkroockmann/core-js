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
                fail = function (data, response) {
                    dfd.reject(data, response);
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
