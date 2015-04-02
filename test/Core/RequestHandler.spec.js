define(['Core/Api', 'Core/RequestHandler', 'jquery', 'Core/Request'], function (Api, RequestHandler, jQuery, TbRequest) {
    'use strict';

    var Response,
        Request = new TbRequest(),
        fakeXhr = {
            responseText: '',
            status: '',
            getAllResponseHeaders: function () {
                return '';
            }
        };

    describe('Request handler spec', function () {

        it('Testing buildResponse function, he build a Response object with a data\'s callback of ajax', function () {
            var headers = 'Content-Type: application/json \r Range: 5, 10',
                datas = [{'foo': 'bar'}, {'bar': 'foo'}],
                rawDatas = '{"0": {"foo": "bar"}, "1": {"far": "foo"}}',
                status = 404,
                statusText = '404 not found',
                errorText = 'An error occured.';

            Response = RequestHandler.buildResponse(headers, datas, rawDatas, status, statusText, errorText);
            expect(typeof Response).toBe('object');
        });

        it('Testing buildHeaders function, he will add all header in Response', function () {
            expect(Response.getHeader('Content-Type')).toEqual('application/json');
            expect(Response.getHeader('Range')).toEqual('5, 10');
        });

        it("Testing if event 'request:send:before' is trigged", function () {
            var callBackTrigger = jasmine.createSpy(),
                datas = {foo: 'bar'};

            spyOn(jQuery, "ajax").and.callFake(function () {
                var d = jQuery.Deferred();
                d.resolve(datas, '', fakeXhr);

                return d.promise();
            });

            Api.Mediator.subscribe('request:send:before', callBackTrigger);

            RequestHandler.send(Request);
            expect(callBackTrigger).toHaveBeenCalled();
        });

        it("Testing Send::Success, should execute trigger event (request:send:done)", function () {
            var callBackTrigger = jasmine.createSpy(),
                datas = {foo: 'bar'};

            spyOn(jQuery, "ajax").and.callFake(function () {
                var d = jQuery.Deferred();
                d.resolve(datas, '', fakeXhr);

                return d.promise();
            });

            Api.Mediator.subscribe('request:send:done', callBackTrigger);

            RequestHandler.send(Request);
            expect(callBackTrigger).toHaveBeenCalled();
        });

        it("Testing Send::Fail, should execute trigger event (request:send:fail)", function () {
            var callBackTrigger = jasmine.createSpy();

            spyOn(jQuery, "ajax").and.callFake(function () {
                var d = jQuery.Deferred();
                d.reject(fakeXhr, '', '');

                return d.promise();
            });

            Api.Mediator.subscribe('request:send:fail', callBackTrigger);

            RequestHandler.send(Request);
            expect(callBackTrigger).toHaveBeenCalled();
        });

        it("Testing Send if request is null", function () {
            var callback = jasmine.createSpy();

            spyOn(jQuery, "ajax").and.callFake(function () {
                var d = jQuery.Deferred();
                d.reject(fakeXhr, '', '');

                return d.promise();
            });

            RequestHandler.send(null, callback);
            expect(callback).not.toHaveBeenCalled();
        });

    });
});
