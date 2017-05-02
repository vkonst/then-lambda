/* global require, describe, beforeEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

describe('thenContext.js', () => {
    let ThenContext = require('../thenContext');
    let thenContext;

    beforeEach(() => { thenContext = new ThenContext(event, ctx, cb) });

    describe('"thenContext" module', function () {
        it('shall export "ThenContext" constructor function', function () {
            assert.equal(typeof ThenContext, 'function');
        })
    });

    describe('"ThenContext" constructor function', function () {
        it('shall create "thenContext" object', function () {
            let thenContext = new ThenContext();
            assert.equal(typeof thenContext, 'object');
        })
    });

    describe('"thenContext" object', function () {
        it('shall has "res" property being object', function () {
            assert.equal(typeof thenContext.res, 'object');
        });

        it('shall has "promisify" method', function () {
            assert.equal(typeof thenContext.promisify, 'function');
        });

        it('shall has "finalize" method', function () {
            assert.equal(typeof thenContext.finalize, 'function');
        });
    });

    describe('"promisify" method', function () {
        it('shall return a promise', function () {
            assert.equal(thenContext.promisify() instanceof Promise, true);
        });

        it('shall return a promise resolving to itself', function (done) {
            thenContext.promisify()
                .then((self) => {
                    assert.equal(self, thenContext);
                    done();
                });
        });
    });

    describe('"finalize" method', function () {
        let unbindReferenceToFinilize;
        beforeEach( () => {
            unbindReferenceToFinilize = thenContext.finalize;
            cb.reset();
        });

        it('being called, shall be bind to "thenContext" object', function () {
            unbindReferenceToFinilize();
            assert.equal(cb.calledOn(thenContext), true);
        });

        it('shall call "callback" function', function () {
            unbindReferenceToFinilize();
            assert.equal(cb.calledOnce, true);
        });

        it('shall "callback" with null err and "ok" response if no argements passed', function () {
            unbindReferenceToFinilize();
            assert.equal(cb.calledWith(null, okResponse), true);
        });

        it('shall "callback" with null err and "error" response if error passed', function () {
            unbindReferenceToFinilize({message: errMsg});
            assert.equal(cb.calledWith(null, errResponse), true);
        });
    });

    const event = {whatItIs: 'mock event'};
    const ctx = {whatItIs: 'mock context'};
    let cb = sinon.spy();

    const okResponse = {
        headers: {'Content-Type': 'application/json'},
        body:  '{"result":"Ok"}',
        statusCode: '200'
    };

    const errMsg = 'mock error message';
    const errResponse = {
        headers: {'Content-Type': 'text/plain'},
        body:  errMsg,
        statusCode: '400'
    };

});
