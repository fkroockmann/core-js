define(['require', 'Core'], function (require) {
    'use strict';

    var api = require('Core'),

        argument = 'not realy',

        fake = {
            withoutThis: function () {
                throw 'Fake error';
            },

            withThis: function (something) {
                return this.withoutThis(something);
            }
        };

    describe('Mediator publish and subscribe spec', function () {
        it('Subscribe without context and publish', function () {
            api.Mediator.subscribe('a fake event', fake.withoutThis);
            spyOn(api.exception, 'silent');

            api.Mediator.publish('a fake event', argument);
            expect(api.exception.silent).toHaveBeenCalledWith(
                'MediatorException',
                12201,
                'Mediator caught an error when the topic : "' + 'a fake event' + '" was published.',
                {
                    topic: 'a fake event',
                    context: undefined,
                    callback: fake.withoutThis,
                    args: ['not realy'],
                    error: 'Fake error'
                }
            );

            api.Mediator.unsubscribe('a fake event', fake.withoutThis);
        });

        it('Subscribe with context them publish and unsubscribe', function () {
            api.Mediator.subscribe('another fake event', fake.withThis, fake);
            spyOn(fake, 'withoutThis');

            api.Mediator.publish('another fake event', argument);
            expect(fake.withoutThis).toHaveBeenCalledWith(argument);

            spyOn(console, 'info');
            api.Mediator.unsubscribe('another fake event', fake.withThis);

            api.Mediator.publish('another fake event', argument);
            expect(console.info).not.toHaveBeenCalled();
        });

        it('Subscribe with no context them publish', function () {
            api.Mediator.subscribe('another fake event', fake.withThis);
            spyOn(fake, 'withoutThis');

            api.Mediator.publish('another fake event', argument);
            expect(fake.withoutThis).not.toHaveBeenCalledWith(argument);
        });

        it('Persistent publish an post subscribe', function () {
            api.Mediator.persistentPublish('persistent fake event', argument);

            spyOn(fake, 'withoutThis');

            api.Mediator.subscribe('persistent fake event', fake.withoutThis, fake);

            expect(fake.withoutThis).toHaveBeenCalledWith(argument);

        });

        it('Remove persistent publish an post subscribe', function () {
            api.Mediator.removePublish('persistent fake event');

            spyOn(fake, 'withoutThis');

            api.Mediator.subscribe('persistent fake event', fake.withoutThis, fake);

            expect(fake.withoutThis).not.toHaveBeenCalledWith(argument);

        });


        it('Subscribe Once', function () {

            spyOn(fake, 'withoutThis');

            api.Mediator.subscribeOnce('fake event play once time', fake.withoutThis, fake);
            api.Mediator.subscribeOnce('fake event play once time', fake.withThis, fake);

            api.Mediator.publish('fake event play once time', argument);
            spyOn(fake, 'withThis');

            api.Mediator.publish('fake event play once time', argument);

            expect(fake.withoutThis).toHaveBeenCalledWith(argument);
            expect(fake.withThis).not.toHaveBeenCalledWith(argument);

        });
    });
});
