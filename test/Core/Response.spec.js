define(['Core/Response'], function (CoreResponse) {
    'use strict';

    var Response = new CoreResponse();

    describe('Test Response', function () {
        it('Testing Headers getter/setter', function () {
            var headers = {'Content-Type': 'application/json', 'Range': '1, 10'};

            expect(Response.getHeaders()).toEqual({});

            Response.setHeaders(headers);
            expect(Response.getHeaders()).toEqual(headers);
            expect(Response.getHeader('Content-Type')).toEqual('application/json');
            expect(Response.getHeader('foo')).toEqual(null);

            Response.addHeader('bar', 'foo');
            expect(Response.getHeader('bar')).toEqual('foo');
        });

        it('Testing RawData getter/setter', function () {
            var rawData = '{"foo": "bar"}';

            expect(Response.getRawData()).toEqual('');

            Response.setRawData(rawData);
            expect(Response.getRawData()).toEqual(rawData);
        });

        it('Testing Data getter/setter', function () {
            var data = [{"foo": "bar"}, {"bar": "foo"}];

            expect(Response.getData()).toEqual('{"foo": "bar"}');

            Response.setData(data);
            expect(Response.getData()).toEqual(data);
        });

        it('Testing Status getter/setter', function () {
            var status = 404;

            expect(Response.getStatus()).toEqual(200);

            Response.setStatus(status);
            expect(Response.getStatus()).toEqual(status);
        });

        it('Testing Status text getter/setter', function () {
            var statusText = '404 not found';

            expect(Response.getStatusText()).toEqual('');

            Response.setStatusText(statusText);
            expect(Response.getStatusText()).toEqual(statusText);
        });

        it('Testing Error text getter/setter', function () {
            var errorText = 'An error occured.';

            expect(Response.getErrorText()).toEqual('');

            Response.setErrorText(errorText);
            expect(Response.getErrorText()).toEqual(errorText);
        });
    });
});
