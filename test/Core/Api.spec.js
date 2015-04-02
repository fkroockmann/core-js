define(['Core', 'Core/ApplicationManager'], function (Core, ApplicationManager) {
    'use strict';

    describe('Core Api test', function () {
        it('Test if is fully initialized', function () {
            expect(Core.ApplicationManager).toBe(ApplicationManager);
        });

        it('Test if is the registred value is protected', function () {
            Core.register('ApplicationManager', {});
            expect(Core.ApplicationManager).toBe(ApplicationManager);
        });

        it('Test getter and setter', function () {
            Core.set('foo', 'bar');
            expect(Core.get('foo')).toBe('bar');
        });

        it('Test unset', function () {
            Core.unset('foo');
            expect(Core.get('foo')).toBe(undefined);
        });
    });
});
