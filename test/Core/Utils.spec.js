define(['require', 'Core', 'Core/Utils'], function (require) {
    'use strict';
    var smartList,
        core = require('Core'),
        bbUtils = require('Core/Utils');
    describe('Utils spec', function () {
        /* setup */
        it('Test castAsArray', function () {
            var obj = {
                    'test': 'value',
                    2: 'value',
                    '3': 'value3'
                },

                arr = [
                    'value',
                    'value'
                ],

                objInArr = bbUtils.castAsArray(obj);

            expect(objInArr instanceof Array).toBe(true);
            expect(objInArr.length).toBe(3);
            expect(bbUtils.castAsArray(arr)).toBe(arr);
        });
        it('Creates a SmartList', function () {
            smartList = new core.SmartList();
            expect(smartList).toBeDefined();
            expect(smartList).not.toBeNull();
            expect(smartList.getSize()).toEqual(0);
        });
        it('Adds and removes smartList contents', function () {
            try {
                smartList = new core.SmartList();
                smartList.set('radical', 'blaze');
                expect(smartList.getSize()).toEqual(1);
                expect(smartList.get('radical')).toEqual('blaze');
                /* remove content */
                smartList.deleteItemById('radical');
                expect(smartList.get('radical')).toBe(false);
                expect(smartList.getSize()).toEqual(0);
            } catch (e) {
                console.log(e);
            }
        });
        it('Delete and replace  non object Smartlist item should throw an exception', function () {
            smartList = new core.SmartList();
            smartList.set('radical', 'blaze');
            try {
                smartList.deleteItem();
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toBe('SmartList:replaceItem expects one parameter');
            }
            try {
                smartList.deleteItem('radical');
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toBe('SmartList:deleteItem [item] should be a object');
            }
            try {
                smartList.replaceItem();
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toBe('SmartList:replaceItem expects one parameter');
            }
        });
        it('init with config without idKey', function () {
            try {
                smartList = new core.SmartList({});
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toBe('SmartList:init if a config param is provided a config.idKey is expected');
            }
        });
        it('Lifecycle callback: onInit, onChange, onDestroy, onAdd, onReplace, onDelete', function () {
            smartList = new core.SmartList({
                idKey: 'uid'
            });
            /* onInit */
            smartList.onInit = function () {
                console.log('callback onInit...');
            };
            smartList.onChange = function () {
                console.log('onChange');
            };
            smartList.onReplace = function () {
                console.log('onReplace ...');
            };
            smartList.onDelete = function () {
                console.log('onDelete ...');
            };
            smartList.onDestroy = function () {
                console.log('onDestroy ...');
            };
            spyOn(smartList, 'onInit');
            spyOn(smartList, 'onChange');
            spyOn(smartList, 'onReplace');
            spyOn(smartList, 'onDelete');
            spyOn(smartList, 'onDestroy');
            try {
                smartList.setData({});
                expect(smartList.onInit).toHaveBeenCalled();
            } catch (e) {
                expect(e).toBe('SmartList:setData data object can\'t be empty');
            }
            /* onChange */
            smartList.set({
                uid: 'str_32',
                name: 'radical'
            });
            expect(smartList.onChange).toHaveBeenCalled();
            expect(smartList.getSize()).toEqual(1);
            smartList.replaceItem({
                uid: 'str_32',
                name: 'strange'
            });
            expect(smartList.onReplace).toHaveBeenCalled();
            expect(smartList.getSize()).toEqual(1);
            smartList.deleteItem({
                uid: 'str_32',
                name: 'strange'
            });
            expect(smartList.onDelete).toHaveBeenCalled();
            expect(smartList.getSize()).toEqual(0);
            smartList.set({
                uid: 'swag',
                name: 'Blazer'
            });
            smartList.deleteItemById('swag');
            expect(smartList.onDelete).toHaveBeenCalled();
            expect(smartList.getSize()).toEqual(0);
            smartList.reset();
            expect(smartList.getSize()).toEqual(0);
            expect(smartList.onDestroy).toHaveBeenCalled();
        });
        it('Add data to SmartList', function () {
            try {
                smartList = new core.SmartList({
                    idKey: 'uid',
                    data: [{
                        uid: 'key1',
                        name: 'toto'
                    }, {
                        uid: 'key1',
                        name: 'titi'
                    }, {
                        uid: 'key1',
                        name: 'tit0'
                    }]
                });
                expect(smartList.getSize()).toEqual(1);
                var data = [{
                    uid: 'sd1',
                    name: 'Harris'
                }, {
                    uid: 'qsdf',
                    name: 'sd'
                }, {
                    uid: 'sdsd',
                    name: 'sdsd'
                }];
                smartList.addData(data);
                expect(smartList.getSize()).toEqual(4);
            } catch (e) {
                console.log(e);
                expect(true).toBe(false);
            }
        });
        it('Require with Promise DONE', function (done) {
            var test = '',
                callbacks = {
                    done: function () {
                        test = 'done';
                    },
                    fail: function () {
                        test = 'fail';
                        expect(test).toEqual('fail');
                    }
                };
            bbUtils.requireWithPromise(['Core/Utils']).done(callbacks.done).fail(callbacks).always(function () {
                expect(test).toEqual('done');
            });
            setTimeout(function () {
                done();
            }, 1000);
        });

        describe('Asycronous require with Promise', function () {
            var test = '';
            beforeEach(function (done) {
                setTimeout(function () {
                    done();
                }, 1);
            });
            it('Require with Promise FAIL', function (done) {
                var callbacks = {
                    fail: function () {
                        test = 'fail';
                    }
                };
                bbUtils.requireWithPromise(['tb.corde.Utils']).fail(callbacks.fail);
                setTimeout(function () {
                    expect(test).toEqual('fail');
                    done();
                }, 1000);
            });
        });
    });
});