define(['require', 'Core', 'Core/Exception', 'Core/Api'], function (require) {
    'use strict';

    var api = require('Core/Api'),

        baseCount = 0;


    describe('Exceptions spec', function () {

        it('Raise new Exception', function () {
            baseCount = api.get('errors') ? api.get('errors').length : 0;

            try {
                api.exception('test', 101, 'test message');
                expect(false).toBe(true);
            } catch (err) {
                expect(err).toBe('Error n 101 test: test message');
            }
        });

        it('Retreive log error', function () {
            var errors = api.get('errors');

            expect(api.get('lastError')).not.toBe(null);

            expect(errors.length).toBe(baseCount + 1);
        });

        it('Retreive multi log errors', function () {
            var errors = api.get('errors');

            try {
                api.exception('test2', 102, 'test message');
                expect(false).toBe(true);
            } catch (err) {
                expect(err).toBe('Error n 102 test2: test message');
            }

            expect(api.get('lastError')).not.toBe(null);

            expect(errors.length).toBe(baseCount + 2);
            expect(errors[errors.length - 1]).toBe(api.get('lastError'));
        });

        it('Try Unknow Exception', function () {
            try {
                api.exception();
                expect(false).toBe(true);
            } catch (err) {
                expect(err).toBe('Error n 500 UnknowException: No description found for this exception.');
            }
        });
    });
});
