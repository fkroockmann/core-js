define(['require', 'Core', 'Core/Api'], function (require) {
    'use strict';

    var Api = require('Core/Api'),
        config = {
            core: {
                ApplicationManager: {
                    appPath: 'resources/src/tb/apps',

                    active: 'main',

                    route: '',

                    applications: {
                        main: {
                            label: 'Main',
                            config: {mainRoute: 'appMain/index'}
                        },
                        layout: {
                            label: 'Layout',
                            config: {mainRoute: 'appLayout/home'}
                        }
                    }
                },
                Inexistent: {
                    foo: 'bar'
                },
                Mediator: {
                    test: 'have to fail'
                }
            },
            component: {
                logger: {
                    level: 9,
                    mode: 'development'
                }
            }
        };

    describe('Core config spec', function () {
        it('test initConfig', function () {
            Api.initConfig(config);

            expect(Api.config('core')).toBe(undefined);
            expect(Api.get('lastError').code).toBe(12300);

            expect(Api.config('component:logger')).toBe(config.component.logger);
            expect(Object.isFrozen(Api.config('component:logger'))).toBe(true);
        });
    });
});
