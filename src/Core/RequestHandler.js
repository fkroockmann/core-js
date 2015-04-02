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
