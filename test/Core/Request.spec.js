define(['Core/Request'], function (TbRequest) {
    'use strict';

    var Request = new TbRequest();

    describe('Test Request', function () {
        it('Testing Url getter/setter', function () {
            var url = '/rest/1/page/000afe665d78ea8f55be8fa6b0907d06';

            expect(Request.getUrl()).toEqual('');

            Request.setUrl(url);
            expect(Request.getUrl()).toEqual(url);
        });

        it('Testing Method getter/setter', function () {
            var method = 'POST';

            expect(Request.getMethod()).toEqual('GET');

            Request.setMethod(method);
            expect(Request.getMethod()).toEqual(method);
        });

        it('Testing Data getter/setter', function () {
            var data = {foo: 'bar'};

            expect(Request.getData()).toEqual(null);

            Request.setData(data);
            expect(Request.getData()).toEqual(data);
        });

        it('Testing Headers getter/setter', function () {
            var headers = {'Content-Type': 'application/json', 'Range': '1, 10'};

            expect(Request.getHeaders()).toEqual({'Content-Type': 'application/x-www-form-uriencoded'});

            Request.setHeaders(headers);
            expect(Request.getHeaders()).toEqual(headers);
            expect(Request.getHeader('Content-Type')).toEqual('application/json');
            expect(Request.getHeader('foo')).toEqual(null);

            Request.addHeader('bar', 'foo');
            expect(Request.getHeader('bar')).toEqual('foo');
        });

        it('Testing Content-Type getter/setter', function () {
            var contentType = 'application/json';

            Request.setContentType(contentType);
            expect(Request.getContentType()).toEqual(contentType);
        });

    });
});
