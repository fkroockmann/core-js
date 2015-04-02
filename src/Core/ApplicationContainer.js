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