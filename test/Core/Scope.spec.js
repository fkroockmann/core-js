define(['require', 'Core'], function () {
    'use strict';

    var api = require('Core'),

        mock = {
            specCallbackOpening: function () {
                return;
            },

            specCallbackClosing: function () {
                return;
            },

            testCallbackOpening: function () {
                return;
            },

            testCallbackClosing: function () {
                return;
            },

            slugCallbackOpening: function () {
                throw 'Spec test error';
            },

            slugCallbackClosing: function () {
                return;
            }
        };

    describe('Scope spec', function () {
        it('test scope registring', function () {
            spyOn(mock, 'specCallbackOpening');
            api.Scope.subscribe('spec', mock.specCallbackOpening, mock.specCallbackClosing);
            api.Scope.register('spec', 'test');
            expect(mock.specCallbackOpening).toHaveBeenCalled();
        });

        it('test scope closing', function () {
            spyOn(mock, 'testCallbackOpening');
            spyOn(mock, 'testCallbackClosing');

            api.Scope.subscribe('test', mock.testCallbackOpening, mock.testCallbackClosing);
            expect(mock.testCallbackOpening).toHaveBeenCalled();

            api.Scope.register('spec', 'slug');

            expect(mock.testCallbackClosing).toHaveBeenCalled();
        });

        it('test scope errors', function () {
            try {
                api.Scope.register({});
                expect(false).toBe(true);
            } catch (e) {
                expect(e).toBe('Error n ' + 12101 + ' ' + 'ScopeException' + ': ' + 'All scope have to be a string.');
            }

            try {
                api.Scope.subscribe('slug', false, mock.slugCallbackClosing);
                expect(false).toBe(true);
            } catch (e) {
                expect(e).toBe('Error n ' + 12102 + ' ' + 'ScopeException' + ': ' + 'Scope subscription was incorrect.');
            }

            spyOn(api.exception, 'silent');
            api.Scope.subscribe('slug', mock.slugCallbackOpening, mock.slugCallbackClosing);
            expect(api.exception.silent).toHaveBeenCalled();
        });

        it('test single scope opening and closing', function () {
            spyOn(mock, 'testCallbackOpening');
            spyOn(mock, 'testCallbackClosing');
            api.Scope.subscribe('test', mock.testCallbackOpening, mock.testCallbackClosing);
            api.Scope.open('test');
            expect(mock.testCallbackOpening).toHaveBeenCalled();

            api.Scope.close('test');
            expect(mock.testCallbackClosing).toHaveBeenCalled();

            api.Scope.close('spec');
            api.Scope.subscribe('slug', mock.slugCallbackOpening, mock.slugCallbackClosing);
            api.Scope.subscribe('spec', mock.specCallbackOpening, mock.specCallbackClosing);

            spyOn(mock, 'slugCallbackOpening');
            spyOn(mock, 'specCallbackClosing');

            api.Scope.open('slug');
            expect(mock.slugCallbackOpening).not.toHaveBeenCalled();

            api.Scope.close('test');
            expect(mock.specCallbackClosing).not.toHaveBeenCalled();
        });
    });
});
